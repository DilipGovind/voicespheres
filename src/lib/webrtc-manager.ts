export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private isMuted = false;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioContext: AudioContext | null = null;
  private signalSender: ((targetUserId: string, signal: any) => void) | null = null;

  // Multi-tier ICE Configuration with Google STUN + OpenRelay TURN for Carrier-Grade Cellular NAT traversal
  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
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

      // Retrofit newly acquired audio track to any peer connections that were already established
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !this.isMuted;
        this.peerConnections.forEach(async (pc, peerId) => {
          try {
            const senders = pc.getSenders();
            const existingSender = senders.find((s) => s.track?.kind === 'audio');
            if (existingSender) {
              await existingSender.replaceTrack(audioTrack);
            } else {
              pc.addTrack(audioTrack, stream);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              if (this.signalSender) {
                this.signalSender(peerId, { type: 'offer', sdp: offer });
              }
            }
          } catch (e) {
            console.warn('Could not add audio track to established peer:', peerId, e);
          }
        });
      }

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
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }
    } catch {}
  }

  /**
   * Connect with a remote peer using the W3C Perfect Negotiation Pattern.
   * The peer with (myUserId > remoteUserId) deterministically initiates the offer.
   */
  public async connectPeer(myUserId: string, remoteUserId: string, forceInitiator?: boolean) {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return;
    if (this.peerConnections.has(remoteUserId)) return;

    const isInitiator = forceInitiator ?? myUserId > remoteUserId;

    try {
      const pc = new RTCPeerConnection(this.rtcConfig);
      this.peerConnections.set(remoteUserId, pc);

      // Add local audio tracks if microphone is already active
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !this.isMuted;
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
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          this.unlockMobileAudio();
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          
        });
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
   * Process incoming WebRTC signaling (offer, answer, ICE) with queueing support.
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
              track.enabled = !this.isMuted;
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
                candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
              });
            }
          };

          pc.onconnectionstatechange = () => {
            if (pc && pc.connectionState === 'connected') {
              this.unlockMobileAudio();
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Flush any queued ICE candidates that arrived before the offer
        const queuedCandidates = this.pendingCandidates.get(senderUserId);
        if (queuedCandidates && queuedCandidates.length > 0) {
          for (const cand of queuedCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch {}
          }
          this.pendingCandidates.delete(senderUserId);
        }

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

          // Flush any queued ICE candidates that arrived before the answer
          const queuedCandidates = this.pendingCandidates.get(senderUserId);
          if (queuedCandidates && queuedCandidates.length > 0) {
            for (const cand of queuedCandidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {}
            }
            this.pendingCandidates.delete(senderUserId);
          }
        }
      } else if (signal.type === 'ice' && signal.candidate) {
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch {}
        } else {
          // Queue candidate until setRemoteDescription completes
          let queue = this.pendingCandidates.get(senderUserId);
          if (!queue) {
            queue = [];
            this.pendingCandidates.set(senderUserId, queue);
          }
          queue.push(signal.candidate);
        }
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  }

  /**
   * Attach remote audio stream with dual routing:
   * 1. Web Audio API destination (bypasses mobile browser autoplay blocks)
   * 2. HTML5 <audio> element with touch/click auto-unlock retry
   */
  private attachRemoteAudio(remoteUserId: string, stream: MediaStream) {
    if (typeof window === 'undefined') return;

    // 1. Web Audio API Stream Routing
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.audioContext.destination);
      }
    } catch (err) {
      console.warn('Web Audio stream routing note:', err);
    }

    // 2. HTML5 Audio Element with PlaysInline and User Unlock
    if (typeof document !== 'undefined') {
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
      audioEl.volume = 1.0;
      audioEl.play().catch(() => {
        // Queue playback unlock on next user touch or click
        const unlock = () => {
          if (audioEl) audioEl.play().catch(() => {});
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
          }
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      });
    }
  }

  public removePeer(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }

    this.pendingCandidates.delete(remoteUserId);

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
    this.pendingCandidates.clear();

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
