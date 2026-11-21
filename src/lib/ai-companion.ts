/**
 * AI Voice Companion
 * Runs locally using the browser's SpeechSynthesis API.
 * Never connects to any paid third-party AI API and requires no credentials.
 */

import { Participant } from '@/types/room';

export interface AICompanionConfig {
  enabled: boolean;
  voiceName: string;
  rate: number;
  pitch: number;
}

export const AI_COMPANION_DEFAULT_CONFIG: AICompanionConfig = {
  enabled: false, // Disabled by default per project requirement
  voiceName: 'Default',
  rate: 1.0,
  pitch: 1.0,
};

export const AI_COMPANION_PARTICIPANT: Participant = {
  id: 'ai_companion_aria',
  name: 'Aria (AI Voice Companion)',
  avatar: '🤖',
  role: 'speaker',
  isMuted: false,
  isSpeaking: false,
  isHandRaised: false,
  isAacUser: true,
  volume: 90,
  joinedAt: Date.now(),
  country: 'Global',
  pronouns: 'they/them',
};

export class AICompanionService {
  private static instance: AICompanionService | null = null;
  private config: AICompanionConfig = AI_COMPANION_DEFAULT_CONFIG;
  private isSpeaking = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('voicesphere_ai_companion_config');
        if (saved) {
          this.config = { ...AI_COMPANION_DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      } catch {}
    }
  }

  public static getInstance(): AICompanionService {
    if (!AICompanionService.instance) {
      AICompanionService.instance = new AICompanionService();
    }
    return AICompanionService.instance;
  }

  public getConfig(): AICompanionConfig {
    return { ...this.config };
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voicesphere_ai_companion_config', JSON.stringify(this.config));
      } catch {}
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Speak a phrase using the browser's zero-cost SpeechSynthesis engine
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.config.enabled || typeof window === 'undefined' || !window.speechSynthesis) {
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('[AICompanion] Speech synthesis error:', err);
      return false;
    }
  }

  /**
   * Offline synthesized voice responses for room assistance
   */
  public getRoomIntroPrompt(roomName: string, topic: string): string {
    return `Hello everyone! I am Aria, your AI voice companion. Welcome to ${roomName}. We are discussing: ${topic}. Live captions and keyboard shortcuts are active.`;
  }

  public getStageTransitionPrompt(stage: string): string {
    switch (stage) {
      case 'INTRO':
        return 'Welcome to the introduction stage. Feel free to introduce yourself or raise your hand.';
      case 'TOPIC':
        return 'The presenter is now introducing the main topic.';
      case 'QUEUE':
        return 'We are now in the structured speaker queue. Speakers will take turns sequentially.';
      case 'DISCUSSION':
        return 'Open discussion is now active. Everyone is invited to share their thoughts.';
      case 'QA':
        return 'Questions and answers session is now open.';
      case 'CLOSING':
        return 'The room has reached the closing stage. Thank you all for participating.';
      default:
        return `The room has transitioned to the ${stage} stage.`;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
  }
}
