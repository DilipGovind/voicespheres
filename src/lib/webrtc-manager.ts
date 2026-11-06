export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private isMuted = false;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioContext: AudioContext | null = null;
  private signalSender: ((targetUserId: string, signal: any) => void) | null = null;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
    ],
  };

  public setSignalSender(sender: (targetUserId: string, signal: any) => void) {
    this.signalSender = sender;
  }

  public async acquireMicrophone(): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('Microphone access is not supported in this environment');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream = stream;
      this.unlockMobileAudio();
      return stream;
    } catch (err) {
      console.warn('Microphone permission denied or device not found, creating silent audio stream fallback:', err);
      return this.createSilentAudioStream();
    }
  }

  public createSilentAudioStream(): MediaStream {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        gain.gain.value = 0; // completely silent
        osc.connect(gain);
        gain.connect(this.audioDestination);
        osc.start();
        this.localStream = this.audioDestination.stream;
        return this.localStream;
      }
    } catch {
      // ignore
    }
    if (typeof MediaStream !== 'undefined') {
      return new MediaStream();
    }
    return { getTracks: () => [], getAudioTracks: () => [] } as unknown as MediaStream;
  }

  /**
   * Mobile audio policy unlock: mobile browsers (Android Chrome, iOS Safari)
   * require AudioContext resume on user gesture.
   */
  public unlockMobileAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch {}
  }

  /**
   * Connect or update peer connection for audio exchange with a remote peer
   */
  public async connectPeer(remoteUserId: string, isInitiator: boolean) {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return;
    if (this.peerConnections.has(remoteUserId)) return;

    try {
      const pc = new RTCPeerConnection(this.rtcConfig);
      this.peerConnections.set(remoteUserId, pc);

      // Add local audio tracks if microphone is active
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      // Handle incoming remote audio stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.attachRemoteAudio(remoteUserId, event.streams[0]);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && this.signalSender) {
          this.signalSender(remoteUserId, {
            type: 'ice',
            candidate: event.candidate,
          });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (this.signalSender) {
          this.signalSender(remoteUserId, {
            type: 'offer',
            sdp: offer,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to establish WebRTC peer connection with', remoteUserId, err);
    }
  }

  /**
   * Process incoming WebRTC signaling (offer, answer, ICE)
   */
  public async handleIncomingSignal(senderUserId: string, signal: any) {
    if (!signal) return;

    try {
      let pc = this.peerConnections.get(senderUserId);

      if (signal.type === 'offer') {
        if (!pc) {
          pc = new RTCPeerConnection(this.rtcConfig);
          this.peerConnections.set(senderUserId, pc);

          if (this.localStream) {
            this.localStream.getAudioTracks().forEach((track) => {
              pc!.addTrack(track, this.localStream!);
            });
          }

          pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
              this.attachRemoteAudio(senderUserId, event.streams[0]);
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate && this.signalSender) {
              this.signalSender(senderUserId, {
                type: 'ice',
                candidate: event.candidate,
              });
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.signalSender) {
          this.signalSender(senderUserId, {
            type: 'answer',
            sdp: answer,
          });
        }
      } else if (signal.type === 'answer' && pc) {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'ice' && pc && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          // ignore potential candidate race conditions
        }
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  }

  private attachRemoteAudio(remoteUserId: string, stream: MediaStream) {
    if (typeof document === 'undefined') return;

    let audioEl = this.remoteAudioElements.get(remoteUserId);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      this.remoteAudioElements.set(remoteUserId, audioEl);
    }

    audioEl.srcObject = stream;
    audioEl.play().catch(() => {
      // Audio playback might be queued until user interaction
    });
  }

  public removePeer(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }

    const audioEl = this.remoteAudioElements.get(remoteUserId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(remoteUserId);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    this.remoteAudioElements.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    });
    this.remoteAudioElements.clear();
  }

  public getStream(): MediaStream | null {
    return this.localStream;
  }
}

export const webRTCManager = new WebRTCManager();
