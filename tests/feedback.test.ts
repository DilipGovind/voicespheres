import { describe, it, expect } from 'vitest';
import {
  getStoredFeedback,
  submitNewFeedback,
  toggleHelpfulReaction,
  INITIAL_COMMUNITY_FEEDBACK,
} from '../src/lib/feedback-store';

describe('Community Feedback System', () => {
  it('retrieves community feedback with initial quality reviews', () => {
    const feedbackList = getStoredFeedback();
    expect(feedbackList.length).toBeGreaterThanOrEqual(INITIAL_COMMUNITY_FEEDBACK.length);

    // Verify categories and ratings
    feedbackList.forEach((fb) => {
      expect(fb.id).toBeDefined();
      expect(fb.title.length).toBeGreaterThan(0);
      expect(fb.message.length).toBeGreaterThan(0);
      expect(fb.rating).toBeGreaterThanOrEqual(1);
      expect(fb.rating).toBeLessThanOrEqual(5);
      expect(fb.category).toBeDefined();
    });
  });

  it('submits a new valuable feedback item across category and rating', () => {
    const newFeedback = submitNewFeedback({
      category: 'accessibility',
      rating: 5,
      title: 'High Contrast Mode with Yellow/Black satisfies AAA',
      message: 'The AAA contrast mode provides exceptional clarity on low-brightness monitors. The keyboard navigation outline is sharp and unmistakable.',
      userName: 'A11y Auditor',
      userEmail: 'auditor@example.org',
      activePreset: 'PRESET_B_LOW_VISION_HIGH_CONTRAST',
      includeSystemInfo: true,
    });

    expect(newFeedback.success).toBe(true);
    expect(newFeedback.item).toBeDefined();
    expect(newFeedback.item?.title).toBe('High Contrast Mode with Yellow/Black satisfies AAA');
    expect(newFeedback.item?.rating).toBe(5);
    expect(newFeedback.item?.category).toBe('accessibility');
    expect(newFeedback.item?.userName).toBe('A11y Auditor');
    expect(newFeedback.item?.activePreset).toBe('PRESET_B_LOW_VISION_HIGH_CONTRAST');
    expect(newFeedback.item?.helpfulCount).toBe(0);

    // Feedback appears in stored list
    const updated = getStoredFeedback();
    const found = updated.find((fb) => fb.id === newFeedback.item?.id);
    expect(found).toBeDefined();
  });

  it('submits feature request feedback properly', () => {
    const featureFeedback = submitNewFeedback({
      category: 'feature_request',
      rating: 5,
      title: 'Support for custom audio filters & noise suppression profiles',
      message: 'It would be amazing to save custom noise gate threshold profiles per room or per microphone device.',
      userName: 'Sound Engineer',
    });

    expect(featureFeedback.success).toBe(true);
    expect(featureFeedback.item?.category).toBe('feature_request');
  });

  it('rejects feedback with missing or insufficient content', () => {
    // Missing title
    const emptyTitle = submitNewFeedback({
      category: 'general',
      rating: 4,
      title: '',
      message: 'Here is some detailed message that is long enough.',
    });
    expect(emptyTitle.success).toBe(false);
    expect(emptyTitle.error).toMatch(/provide both a title and feedback description/i);

    // Message too short
    const shortMessage = submitNewFeedback({
      category: 'general',
      rating: 4,
      title: 'Valid Title',
      message: 'Short',
    });
    expect(shortMessage.success).toBe(false);
    expect(shortMessage.error).toMatch(/at least 10 characters/i);
  });

  it('allows incrementing helpful votes on community feedback', () => {
    const initialList = getStoredFeedback();
    const targetItem = initialList[0];
    const initialHelpful = targetItem.helpfulCount;

    const afterReaction = toggleHelpfulReaction(targetItem.id);
    const updatedItem = afterReaction.find((fb) => fb.id === targetItem.id);

    expect(updatedItem?.helpfulCount).toBe(initialHelpful + 1);
  });
});
