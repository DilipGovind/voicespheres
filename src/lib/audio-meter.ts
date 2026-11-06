export class AudioMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isRunning = false;
  private onLevelCallback: ((level: number, isSpeaking: boolean) => void) | null = null;
  private speakingThreshold = 18; // percent

  constructor(threshold = 18) {
    this.speakingThreshold = threshold;
  }

  public attachStream(stream: MediaStream, onLevel: (level: number, isSpeaking: boolean) => void) {
    this.stop();
    this.onLevelCallback = onLevel;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.isRunning = true;
      this.loop();
    } catch (err) {
      console.warn('AudioMeter initialization warning:', err);
    }
  }

  private loop = () => {
    if (!this.isRunning || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Map 0-128 range to 0-100 percentage
    const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
    const isSpeaking = normalizedLevel >= this.speakingThreshold;

    this.onLevelCallback?.(normalizedLevel, isSpeaking);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {
        // ignore
      }
      this.source = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
    this.onLevelCallback?.(0, false);
  }
}
