/**
 * Voice Adapter Factory
 * Allows hot-swapping or selecting voice providers (LiveKit SFU vs Mock/Offline).
 */

import { IVoiceAdapter } from './voice-adapter.interface';
import { LiveKitVoiceAdapter } from './livekit-adapter';
import { MockVoiceAdapter } from './mock-adapter';

let activeAdapter: IVoiceAdapter | null = null;

export function getVoiceAdapter(provider: 'livekit' | 'mock'): IVoiceAdapter {
  if (provider === 'livekit') {
    // Check if running in browser environment with WebRTC support
    if (typeof window !== 'undefined' && (window.RTCPeerConnection || (window as any).webkitRTCPeerConnection)) {
      return new LiveKitVoiceAdapter();
    }
  }

  return new MockVoiceAdapter();
}

export function getDefaultVoiceAdapter(): IVoiceAdapter {
  if (!activeAdapter) {
    // Default to LiveKit if available, fallback to mock
    activeAdapter = getVoiceAdapter('livekit');
  }
  return activeAdapter;
}
