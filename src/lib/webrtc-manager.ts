export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private remoteAudioSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  private remotePanners: Map<string, PannerNode> = new Map();
  private spatialAudioEnabled = true;
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private isMuted = false;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private audioContext: AudioContext | null = null;
  private micMonitorGain: GainNode | null = null;
  private isMonitoring = false;
  private isAudioBlocked = false;
  private autoplayBlockedListeners: Set<(blocked: boolean) => void> = new Set();
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

  public onAutoplayBlockedChange(listener: (blocked: boolean) => void) {
    this.autoplayBlockedListeners.add(listener);
    listener(this.isAudioBlocked);
    return () => this.autoplayBlockedListeners.delete(listener);
  }

  private notifyAutoplayBlocked(blocked: boolean) {
    this.isAudioBlocked = blocked;
    this.autoplayBlockedListeners.forEach((l) => {
      try {
        l(blocked);
      } catch {}
    });
  }

  public getIsAudioBlocked(): boolean {
    return this.isAudioBlocked;
  }

  /**
   * Unmute and resume all audio output (satisfies browser Autoplay Policies).
   */
  public async unlockAudio(): Promise<boolean> {
    try {
      this.unlockMobileAudio();
      this.remoteAudioElements.forEach(async (audioEl, id) => {
        try {
          audioEl.muted = false;
          await audioEl.play();
        } catch (e) {
          console.warn('[WebRTCManager] Failed to resume audio element for', id, e);
        }
      });
      this.notifyAutoplayBlocked(false);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Local microphone monitor loopback for testing ("Hear Myself / Mic Check").
   */
  public toggleMicMonitoring(enable?: boolean): boolean {
    if (typeof window === 'undefined') return false;
    const nextState = enable !== undefined ? enable : !this.isMonitoring;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (nextState) {
        if (!this.localStream) return false;
        if (!this.micMonitorGain) {
          const micSource = this.audioContext.createMediaStreamSource(this.localStream);
          this.micMonitorGain = this.audioContext.createGain();
          this.micMonitorGain.gain.value = 0.9;
          micSource.connect(this.micMonitorGain);
          this.micMonitorGain.connect(this.audioContext.destination);
        } else {
          this.micMonitorGain.gain.value = 0.9;
        }
        this.isMonitoring = true;
      } else {
        if (this.micMonitorGain) {
          this.micMonitorGain.gain.value = 0;
        }
        this.isMonitoring = false;
      }
    } catch (e) {
      console.warn('[WebRTCManager] Error toggling mic monitoring:', e);
      this.isMonitoring = false;
    }
    return this.isMonitoring;
  }

  public getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  /**
   * Play an immediate audible test chime to verify speakers and device volume.
   */
  public playTestChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      // 3 ascending harmonic notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.32);
      });
    } catch (e) {
      console.warn('[WebRTCManager] Could not play test chime:', e);
    }
  }

  public setSpatialAudioEnabled(enabled: boolean) {
    this.spatialAudioEnabled = enabled;
    this.remotePanners.forEach((panner, peerId) => {
      this.applySpatialPosition(panner, peerId);
    });
  }

  public getSpatialAudioEnabled(): boolean {
    return this.spatialAudioEnabled;
  }

  private applySpatialPosition(panner: PannerNode, peerId: string) {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (!this.spatialAudioEnabled) {
      // Centered position (no azimuth offset)
      if (panner.positionX) {
        panner.positionX.setValueAtTime(0, now);
        panner.positionY.setValueAtTime(0, now);
        panner.positionZ.setValueAtTime(-1, now);
      } else {
        (panner as any).setPosition?.(0, 0, -1);
      }
      return;
    }

    // Deterministic 3D azimuth position: spread peers across stereo field (-55° to +55°)
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = (hash << 5) - hash + peerId.charCodeAt(i);
      hash |= 0;
    }
    const angles = [-45, 45, -30, 30, -55, 55, -15, 15, 0];
    const angleDeg = angles[Math.abs(hash) % angles.length];
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.sin(rad) * 2;
    const y = 0;
    const z = -Math.cos(rad) * 2;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, now);
      panner.positionY.setValueAtTime(y, now);
      panner.positionZ.setValueAtTime(z, now);
    } else {
      (panner as any).setPosition?.(x, y, z);
    }
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
      if (this.localStream && this.localStream.getAudioTracks().length > 0) {
        this.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !this.isMuted;
          pc.addTrack(track, this.localStream!);
        });
      } else {
        // Unified Plan audio transceiver allows receiving audio even if mic is unattached/muted
        try {
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch {}
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

          if (this.localStream && this.localStream.getAudioTracks().length > 0) {
            this.localStream.getAudioTracks().forEach((track) => {
              track.enabled = !this.isMuted;
              pc!.addTrack(track, this.localStream!);
            });
          } else {
            try {
              pc!.addTransceiver('audio', { direction: 'recvonly' });
            } catch {}
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

    // 1. Web Audio API Stream Routing with 3D HRTF Spatial Positioning & GC protection
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        const existingSource = this.remoteAudioSources.get(remoteUserId);
        if (existingSource) {
          try {
            existingSource.disconnect();
          } catch {}
        }
        const existingPanner = this.remotePanners.get(remoteUserId);
        if (existingPanner) {
          try {
            existingPanner.disconnect();
          } catch {}
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        this.applySpatialPosition(panner, remoteUserId);

        source.connect(panner);
        panner.connect(this.audioContext.destination);

        this.remoteAudioSources.set(remoteUserId, source);
        this.remotePanners.set(remoteUserId, panner);
      }
    } catch (err) {
      console.warn('[WebRTCManager] Web Audio spatial routing note:', err);
    }

    // 2. HTML5 Audio Element with PlaysInline and Autoplay policy detection
    if (typeof document !== 'undefined') {
      let audioEl = this.remoteAudioElements.get(remoteUserId);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `remote-audio-${remoteUserId}`;
        audioEl.autoplay = true;
        (audioEl as any).playsInline = true;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.setAttribute('autoplay', 'true');
        // Hidden from visual flow without breaking iOS/WebKit audio decode
        audioEl.style.position = 'fixed';
        audioEl.style.top = '-9999px';
        audioEl.style.left = '-9999px';
        audioEl.style.width = '1px';
        audioEl.style.height = '1px';
        audioEl.style.opacity = '0.001';
        audioEl.style.pointerEvents = 'none';
        document.body.appendChild(audioEl);
        this.remoteAudioElements.set(remoteUserId, audioEl);
      }

      audioEl.srcObject = stream;
      audioEl.muted = false;
      audioEl.volume = 1.0;

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[WebRTCManager] Browser autoplay blocked for peer:', remoteUserId, err);
          this.notifyAutoplayBlocked(true);

          const unlock = () => {
            this.unlockAudio();
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
        });
      }
    }
  }

  public removePeer(remoteUserId: string) {
    const pc = this.peerConnections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteUserId);
    }

    this.pendingCandidates.delete(remoteUserId);

    const source = this.remoteAudioSources.get(remoteUserId);
    if (source) {
      try {
        source.disconnect();
      } catch {}
      this.remoteAudioSources.delete(remoteUserId);
    }

    const panner = this.remotePanners.get(remoteUserId);
    if (panner) {
      try {
        panner.disconnect();
      } catch {}
      this.remotePanners.delete(remoteUserId);
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
    this.pendingCandidates.clear();

    this.remoteAudioSources.forEach((src) => {
      try {
        src.disconnect();
      } catch {}
    });
    this.remoteAudioSources.clear();

    this.remotePanners.forEach((p) => {
      try {
        p.disconnect();
      } catch {}
    });
    this.remotePanners.clear();

    if (this.micMonitorGain) {
      try {
        this.micMonitorGain.disconnect();
      } catch {}
      this.micMonitorGain = null;
    }
    this.isMonitoring = false;

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
