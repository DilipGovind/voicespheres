export class AACSpeechEngine {
  private static instance: AACSpeechEngine;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        this.initVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoices();
        }
      } catch (err) {
        console.warn('[AACSpeechEngine] SpeechSynthesis initialization warning:', err);
      }
    }
  }

  public static getInstance(): AACSpeechEngine {
    if (!AACSpeechEngine.instance) {
      AACSpeechEngine.instance = new AACSpeechEngine();
    }
    return AACSpeechEngine.instance;
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
      this.isInitialized = true;
    } catch (err) {
      console.warn('[AACSpeechEngine] Could not load speech voices:', err);
      this.voices = [];
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.initVoices();
    }
    return this.voices || [];
  }

  public speak(
    text: string,
    options: {
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      lang?: string;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    } = {}
  ): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[AACSpeechEngine] Speech synthesis not supported in this environment');
      return false;
    }

    try {
      // Cancel any active speech to avoid queue lag
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      if (options.lang) {
        utterance.lang = options.lang;
      }

      if (options.voiceURI && this.voices && this.voices.length > 0) {
        const selectedVoice = this.voices.find((v) => v.voiceURI === options.voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => options.onEnd?.();
      utterance.onerror = (e) => options.onError?.(e);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('[AACSpeechEngine] Speech synthesis failed:', err);
      return false;
    }
  }
}
