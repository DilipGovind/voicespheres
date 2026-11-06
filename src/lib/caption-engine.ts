export interface CaptionChunk {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  isAac?: boolean;
}

type CaptionCallback = (chunk: CaptionChunk) => void;

// Declaration for Web Speech API SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class CaptionEngine {
  private recognition: any = null;
  private isListening = false;
  private callbacks: Set<CaptionCallback> = new Set();
  private speakerId: string;
  private speakerName: string;
  private language: string;

  constructor(speakerId: string, speakerName: string, language = 'en-US') {
    this.speakerId = speakerId;
    this.speakerName = speakerName;
    this.language = language;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const textToEmit = finalTranscript || interimTranscript;
        if (textToEmit.trim().length > 0) {
          const chunk: CaptionChunk = {
            id: Math.random().toString(36).substring(2, 9),
            speakerId: this.speakerId,
            speakerName: this.speakerName,
            text: textToEmit.trim(),
            timestamp: Date.now(),
            isFinal: Boolean(finalTranscript),
            isAac: false,
          };
          this.emit(chunk);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if should still be listening
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // ignore
          }
        }
      };
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
    }
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public updateSpeaker(id: string, name: string) {
    this.speakerId = id;
    this.speakerName = name;
  }

  public start() {
    if (!this.recognition || this.isListening) return;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  public onCaption(cb: CaptionCallback) {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  private emit(chunk: CaptionChunk) {
    this.callbacks.forEach((cb) => cb(chunk));
  }

  // Allow manual push of AAC captions or simulated speech captions
  public pushManualCaption(text: string, isAac = true) {
    const chunk: CaptionChunk = {
      id: Math.random().toString(36).substring(2, 9),
      speakerId: this.speakerId,
      speakerName: this.speakerName,
      text,
      timestamp: Date.now(),
      isFinal: true,
      isAac,
    };
    this.emit(chunk);
    return chunk;
  }
}
