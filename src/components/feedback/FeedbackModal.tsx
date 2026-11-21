'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useAuth } from '@/lib/auth-context';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { FeedbackCategory } from '@/types/feedback';
import { submitNewFeedback } from '@/lib/feedback-store';
import { realtimeClient } from '@/lib/socket-client';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Sliders,
  Volume2,
  Lightbulb,
  Bug,
  Globe,
  HeartHandshake,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackModal({ isOpen, onClose, onFeedbackSubmitted }: FeedbackModalProps) {
  const { settings, announce } = useAccessibility();
  const { user } = useAuth();

  const [category, setCategory] = useState<FeedbackCategory>('accessibility');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.displayName || '');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const categories: { key: FeedbackCategory; label: string; icon: React.ElementType }[] = [
    { key: 'accessibility', label: 'Accessibility & Presets', icon: Sliders },
    { key: 'audio_quality', label: 'Audio & Voice Quality', icon: Volume2 },
    { key: 'feature_request', label: 'Feature Request / Idea', icon: Lightbulb },
    { key: 'bug_report', label: 'Bug or Issue', icon: Bug },
    { key: 'languages', label: 'Languages & Translation', icon: Globe },
    { key: 'general', label: 'General Feedback', icon: HeartHandshake },
  ];

  const ratingDescriptions: Record<number, string> = {
    1: 'Needs Major Improvement',
    2: 'Fair / Has Friction',
    3: 'Good / Usable',
    4: 'Very Good / Helpful',
    5: 'Exceptional / Loved It',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Post to local store
      const result = submitNewFeedback({
        category,
        rating,
        title,
        message,
        userName: name.trim() || user?.displayName || 'Community Member',
        userEmail: email.trim() || undefined,
        includeSystemInfo,
        activePreset: settings.preset,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to submit feedback.');
        setIsSubmitting(false);
        return;
      }

      // Also trigger API in background
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          rating,
          title,
          message,
          userName: name.trim() || user?.displayName || 'Community Member',
          userEmail: email.trim() || undefined,
          includeSystemInfo,
          activePreset: settings.preset,
        }),
      }).catch(() => {});

      // Broadcast to other devices via global mesh
      if (result.item) {
        realtimeClient.broadcastFeedbackSubmitted(result.item);
      }

      setSuccessMessage('Thank you for your valuable feedback! It has been recorded.');
      announce('Feedback submitted successfully. Thank you for helping improve VoiceSphere.', 'polite');

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }

      setTimeout(() => {
        setTitle('');
        setMessage('');
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        className="glass-panel relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl mx-auto rounded-3xl p-5 sm:p-8 text-zinc-100 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto overflow-x-hidden border border-white/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
              Community Voice & Feedback
            </span>
            <h2 id="feedback-dialog-title" className="text-xl sm:text-2xl font-black text-white pt-1">
              Share Your Thoughts & Ideas
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              VoiceSphere is shaped by you. Tell us about your accessibility needs, audio quality, bug fixes, or new features.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback window"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Feedback Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300'
                        : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Stars */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Overall Experience Rating
              </span>
              <span className="text-xs text-yellow-300 font-semibold">
                {ratingDescriptions[hoverRating || rating]}
              </span>
            </div>

            <div className="flex items-center space-x-1" role="radiogroup" aria-label="Satisfaction rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} out of 5 stars - ${ratingDescriptions[star]}`}
                  className="p-1 rounded-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                >
                  <Star
                    className={`w-6 h-6 transition ${
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title / Summary */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Subject / Topic *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Loving the Type-to-Speak synthesizer, or Found a caption delay"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
            />
          </div>

          {/* Detailed Message */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Detailed Thoughts & Suggestions *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please share what worked well, what felt challenging, or specific assistive adjustments you would like to see..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
            />
          </div>

          {/* Name & Email (Optional / Pre-filled) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Your Name / Handle (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user?.displayName || 'Anonymous Contributor'}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs sm:text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="For follow-up on your idea"
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs sm:text-sm text-white focus:ring-4 focus:ring-yellow-400 transition"
              />
            </div>
          </div>

          {/* Attach System Info */}
          <label className="flex items-center space-x-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeSystemInfo}
              onChange={(e) => setIncludeSystemInfo(e.target.checked)}
              className="w-4 h-4 rounded accent-yellow-400"
            />
            <span>
              Include active preset (<strong>{settings.preset}</strong>) to help developers reproduce
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4.5 py-2.5 rounded-2xl text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-glow-accent px-6 py-2.5 rounded-2xl disabled:opacity-50 text-black text-xs sm:text-sm font-black shadow-lg flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Sending...' : 'Submit Feedback'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
