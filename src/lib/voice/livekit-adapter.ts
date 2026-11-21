/**
 * LiveKit Voice Adapter
 * Implements IVoiceAdapter using the LiveKit WebRTC SFU client SDK.
 * Enables worldwide low-latency audio rooms behind backend-issued short-lived JWT tokens.
 */

import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  createLocalAudioTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Participant,
  ConnectionState,
} from 'livekit-client';
import {
  IVoiceAdapter,
  VoiceConnectionDetails,
  VoiceConnectionState,
} from './voice-adapter.interface';

export class LiveKitVoiceAdapter implements IVoiceAdapter {
  public readonly id = 'livekit';
  public readonly name = 'LiveKit SFU (WebRTC)';

  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private isLocallyMuted = false;
  private currentState: VoiceConnectionState = 'disconnected';

  // Audio elements map for remote participants
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();

  // Listeners
  private connectionStateListeners: Set<(state: VoiceConnectionState, errorMsg?: string) => void> = new Set();
  private activeSpeakersListeners: Set<(speakerIdentities: string[]) => void> = new Set();
  private participantJoinedListeners: Set<(identity: string, name: string) => void> = new Set();
  private participantLeftListeners: Set<(identity: string) => void> = new Set();
  private audioTrackSubscribedListeners: Set<(identity: string, track: MediaStreamTrack) => void> = new Set();
  private errorListeners: Set<(error: Error) => void> = new Set();

  public getConnectionState(): VoiceConnectionState {
    return this.currentState;
  }

  public isMuted(): boolean {
    return this.isLocallyMuted;
  }

  private setConnectionState(state: VoiceConnectionState, errorMsg?: string) {
    this.currentState = state;
    this.connectionStateListeners.forEach((listener) => {
      try {
        listener(state, errorMsg);
      } catch (err) {
        console.error('[LiveKitAdapter] Listener error:', err);
      }
    });
  }

  public async connect(details: VoiceConnectionDetails): Promise<void> {
    if (this.room) {
      await this.disconnect();
    }

    if (!details.token || !details.serverUrl) {
      const err = new Error('LiveKit connection requires a valid token and serverUrl');
      this.setConnectionState('error', err.message);
      throw err;
    }

    this.setConnectionState('connecting');

    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.setupRoomEvents();

      // Connect to LiveKit SFU server
      await this.room.connect(details.serverUrl, details.token);
      this.setConnectionState('connected');

      // If user has a speaking role, acquire microphone and publish audio track
      const canSpeak =
        details.role === 'host' ||
        details.role === 'moderator' ||
        details.role === 'speaker';

      if (canSpeak) {
        try {
          await this.acquireAndPublishMicrophone();
        } catch (micErr: any) {
          console.warn('[LiveKitAdapter] Microphone acquisition note:', micErr);
          this.connectionStateListeners.forEach((l) =>
            l('connected', 'Microphone permission denied or device not found. Joined as listener.')
          );
        }
      }
    } catch (error: any) {
      console.error('[LiveKitAdapter] Connection failed:', error);
      const errorMsg = error?.message || 'Failed to connect to LiveKit voice server';
      this.setConnectionState('error', errorMsg);
      this.errorListeners.forEach((l) => l(error));
      throw error;
    }
  }

  private setupRoomEvents() {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      this.setConnectionState('connected');
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      this.setConnectionState('reconnecting', 'Network connectivity interrupted. Reconnecting...');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.setConnectionState('connected');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.setConnectionState('disconnected');
      this.cleanupAudioElements();
    });

    this.room.on(
      RoomEvent.TrackSubscribed,
      (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const mediaStreamTrack = track.mediaStreamTrack;
          if (mediaStreamTrack) {
            // Attach audio element to play voice
            const el = track.attach();
            el.id = `livekit-audio-${participant.identity}`;
            document.body.appendChild(el);
            this.remoteAudioElements.set(participant.identity, el);

            this.audioTrackSubscribedListeners.forEach((l) =>
              l(participant.identity, mediaStreamTrack)
            );
          }
        }
      }
    );

    this.room.on(
      RoomEvent.TrackUnsubscribed,
      (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        track.detach();
        const existingEl = this.remoteAudioElements.get(participant.identity);
        if (existingEl && existingEl.parentNode) {
          existingEl.parentNode.removeChild(existingEl);
          this.remoteAudioElements.delete(participant.identity);
        }
      }
    );

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      const activeIdentities = speakers.map((s) => s.identity);
      this.activeSpeakersListeners.forEach((l) => l(activeIdentities));
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      this.participantJoinedListeners.forEach((l) =>
        l(participant.identity, participant.name || participant.identity)
      );
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      const existingEl = this.remoteAudioElements.get(participant.identity);
      if (existingEl && existingEl.parentNode) {
        existingEl.parentNode.removeChild(existingEl);
        this.remoteAudioElements.delete(participant.identity);
      }
      this.participantLeftListeners.forEach((l) => l(participant.identity));
    });
  }

  private async acquireAndPublishMicrophone(): Promise<void> {
    if (!this.room) return;

    try {
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      if (this.isLocallyMuted) {
        this.localAudioTrack.mute();
      }

      await this.room.localParticipant.publishTrack(this.localAudioTrack);
    } catch (err: any) {
      console.warn('[LiveKitAdapter] Unable to publish local microphone:', err);
      throw err;
    }
  }

  public async setMuted(muted: boolean): Promise<boolean> {
    this.isLocallyMuted = muted;

    if (this.localAudioTrack) {
      if (muted) {
        await this.localAudioTrack.mute();
      } else {
        await this.localAudioTrack.unmute();
      }
      return true;
    }

    // If unmuting but don't have track yet, try acquiring it
    if (!muted && this.room && this.room.state === ConnectionState.Connected) {
      try {
        await this.acquireAndPublishMicrophone();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  public async switchMicrophone(deviceId: string): Promise<void> {
    if (this.room) {
      await this.room.switchActiveDevice('audioinput', deviceId);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }

      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }
    } catch (err) {
      console.warn('[LiveKitAdapter] Error during disconnect:', err);
    } finally {
      this.cleanupAudioElements();
      this.setConnectionState('disconnected');
    }
  }

  private cleanupAudioElements() {
    this.remoteAudioElements.forEach((el) => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch {}
    });
    this.remoteAudioElements.clear();
  }

  public onConnectionStateChange(
    listener: (state: VoiceConnectionState, errorMsg?: string) => void
  ): () => void {
    this.connectionStateListeners.add(listener);
    return () => this.connectionStateListeners.delete(listener);
  }

  public onActiveSpeakersChange(
    listener: (speakerIdentities: string[]) => void
  ): () => void {
    this.activeSpeakersListeners.add(listener);
    return () => this.activeSpeakersListeners.delete(listener);
  }

  public onParticipantJoined(
    listener: (identity: string, name: string) => void
  ): () => void {
    this.participantJoinedListeners.add(listener);
    return () => this.participantJoinedListeners.delete(listener);
  }

  public onParticipantLeft(listener: (identity: string) => void): () => void {
    this.participantLeftListeners.add(listener);
    return () => this.participantLeftListeners.delete(listener);
  }

  public onAudioTrackSubscribed(
    listener: (identity: string, track: MediaStreamTrack) => void
  ): () => void {
    this.audioTrackSubscribedListeners.add(listener);
    return () => this.audioTrackSubscribedListeners.delete(listener);
  }

  public onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }
}
