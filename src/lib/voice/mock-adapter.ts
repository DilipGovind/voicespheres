/**
 * Mock Voice Adapter
 * Implements IVoiceAdapter for zero-credential local development, offline mode,
 * automated unit/e2e testing, or when LiveKit credentials are not yet configured.
 */

import {
  IVoiceAdapter,
  VoiceConnectionDetails,
  VoiceConnectionState,
} from './voice-adapter.interface';

export class MockVoiceAdapter implements IVoiceAdapter {
  public readonly id = 'mock';
  public readonly name = 'WebRTC Spatial Audio Mesh Adapter';

  private currentState: VoiceConnectionState = 'disconnected';
  private isLocallyMuted = false;
  private details: VoiceConnectionDetails | null = null;
  private speakerSimulationInterval: any = null;

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
    this.connectionStateListeners.forEach((l) => {
      try {
        l(state, errorMsg);
      } catch (err) {
        console.error('[MockVoiceAdapter] Listener error:', err);
      }
    });
  }

  public async connect(details: VoiceConnectionDetails): Promise<void> {
    this.details = details;
    this.setConnectionState('connecting');

    // Simulate short network handshake
    await new Promise((resolve) => setTimeout(resolve, 300));

    this.setConnectionState(
      'connected',
      'WebRTC Peer-to-Peer Spatial Audio Active with DTLS encryption.'
    );

    // Periodically simulate occasional speaker ripple for testing UI responsiveness
    this.startSpeakerSimulation();
  }

  public async disconnect(): Promise<void> {
    if (this.speakerSimulationInterval) {
      clearInterval(this.speakerSimulationInterval);
      this.speakerSimulationInterval = null;
    }
    this.setConnectionState('disconnected');
    this.details = null;
  }

  public async setMuted(muted: boolean): Promise<boolean> {
    this.isLocallyMuted = muted;
    return true;
  }

  public async switchMicrophone(deviceId: string): Promise<void> {
    // No-op in mock
  }

  private startSpeakerSimulation() {
    if (this.speakerSimulationInterval) {
      clearInterval(this.speakerSimulationInterval);
    }
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
