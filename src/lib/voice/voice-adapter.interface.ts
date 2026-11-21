/**
 * Voice Layer Adapter Interface
 * Decouples the application's audio and room presence from any specific WebRTC/SFU provider (e.g. LiveKit, Agora, Daily, or WebRTC Mesh).
 */

export type VoiceConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface VoiceConnectionDetails {
  provider: 'livekit' | 'mock';
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
  role: 'host' | 'moderator' | 'speaker' | 'listener';
  token?: string;
}

export interface VoiceParticipantAudioState {
  identity: string;
  name: string;
  isSpeaking: boolean;
  audioLevel: number; // 0.0 to 1.0
  isMuted: boolean;
}

export interface IVoiceAdapter {
  readonly id: string;
  readonly name: string;

  /** Current connection state */
  getConnectionState(): VoiceConnectionState;

  /** Microphone mute state */
  isMuted(): boolean;

  /** Connect to the voice room using short-lived credentials */
  connect(details: VoiceConnectionDetails): Promise<void>;

  /** Disconnect from the voice room and release all audio devices */
  disconnect(): Promise<void>;

  /** Mute or unmute local microphone track */
  setMuted(muted: boolean): Promise<boolean>;

  /** Switch active microphone input device */
  switchMicrophone?(deviceId: string): Promise<void>;

  /** Get local audio level (0.0 to 1.0) */
  getAudioLevel?(): number;

  /** Subscribe to connection state changes */
  onConnectionStateChange(
    listener: (state: VoiceConnectionState, errorMsg?: string) => void
  ): () => void;

  /** Subscribe to active speakers changes (for voice ripples / UI highlighting) */
  onActiveSpeakersChange(
    listener: (speakerIdentities: string[]) => void
  ): () => void;

  /** Subscribe to remote participant join event */
  onParticipantJoined(
    listener: (identity: string, name: string) => void
  ): () => void;

  /** Subscribe to remote participant leave event */
  onParticipantLeft(listener: (identity: string) => void): () => void;

  /** Subscribe to remote audio track attachment (for screen readers & visualizers) */
  onAudioTrackSubscribed(
    listener: (identity: string, track: MediaStreamTrack) => void
  ): () => void;

  /** Subscribe to error events */
  onError(listener: (error: Error) => void): () => void;
}
