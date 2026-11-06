import { describe, it, expect } from 'vitest';
import { MANDATORY_AAC_PHRASES, SYMBOL_COMMUNICATION_CARDS } from '../src/types/aac';

describe('Augmentative and Alternative Communication (AAC) Toolkit', () => {
  it('includes all 10 prompt-mandatory quick communication buttons', () => {
    const requiredLabels = [
      'I would like to speak',
      'Please repeat',
      'I need more time',
      'I agree',
      'I disagree',
      'I have a question',
      'Please slow down',
      'I need assistance',
      'I cannot speak right now',
      'Thank you',
    ];

    expect(MANDATORY_AAC_PHRASES.length).toBe(10);
    requiredLabels.forEach((label) => {
      const match = MANDATORY_AAC_PHRASES.find((p) => p.label === label);
      expect(match).toBeDefined();
      expect(match?.speechText.length).toBeGreaterThan(0);
      expect(match?.emoji).toBeDefined();
    });
  });

  it('symbol communication cards include categorized reactions, needs, questions, and flow', () => {
    const categories = new Set(SYMBOL_COMMUNICATION_CARDS.map((c) => c.category));
    expect(categories.has('reactions')).toBe(true);
    expect(categories.has('needs')).toBe(true);
    expect(categories.has('flow')).toBe(true);
    expect(categories.has('social')).toBe(true);
  });
});
