'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FeedbackItem, FeedbackCategory } from '@/types/feedback';
import { getStoredFeedback, toggleHelpfulReaction } from '@/lib/feedback-store';
import { realtimeClient } from '@/lib/socket-client';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  PlusCircle,
  Sliders,
  Volume2,
  Lightbulb,
  Bug,
  Globe,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

interface CommunityFeedbackSectionProps {
  onOpenFeedback: () => void;
}

export function CommunityFeedbackSection({ onOpenFeedback }: CommunityFeedbackSectionProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | FeedbackCategory>('all');

  const loadFeedback = useCallback(async () => {
    // 1. Load local feedback
    const local = getStoredFeedback();
    setFeedbackList(local);

    // 2. Fetch remote community feedback across all devices
    try {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (data?.feedback && Array.isArray(data.feedback)) {
        const map = new Map<string, FeedbackItem>();
        local.forEach((item) => map.set(item.id, item));
        data.feedback.forEach((item: FeedbackItem) => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          } else {
            const existing = map.get(item.id)!;
            map.set(item.id, {
              ...existing,
              ...item,
              helpfulCount: Math.max(existing.helpfulCount, item.helpfulCount),
            });
          }
        });
        const combined = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        setFeedbackList(combined);
        try {
          localStorage.setItem('voicesphere_community_feedback', JSON.stringify(combined));
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadFeedback();
    const interval = setInterval(loadFeedback, 2000);

    const handleFocus = () => loadFeedback();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadFeedback();
    });

    const unsub = realtimeClient.on('global:feedback_submitted', (payload: any) => {
      const newFeedback: FeedbackItem = payload?.feedback || payload;
      if (newFeedback && newFeedback.id) {
        setFeedbackList((prev) => {
          if (prev.some((f) => f.id === newFeedback.id)) return prev;
          const updated = [newFeedback, ...prev];
          try {
            localStorage.setItem('voicesphere_community_feedback', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      unsub();
    };
  }, [loadFeedback]);

  const handleHelpfulClick = (id: string) => {
    const updated = toggleHelpfulReaction(id);
    setFeedbackList(updated);
  };

  const filteredItems =
    selectedFilter === 'all'
      ? feedbackList
      : feedbackList.filter((item) => item.category === selectedFilter);

  const getCategoryBadge = (cat: FeedbackCategory) => {
    switch (cat) {
      case 'accessibility':
        return { label: 'Accessibility', color: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30' };
      case 'audio_quality':
        return { label: 'Audio Quality', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
      case 'feature_request':
        return { label: 'Feature Idea', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'bug_report':
        return { label: 'Issue / Fix', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
      case 'languages':
        return { label: 'Languages', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: 'Community', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    }
  };

  return (
    <section aria-labelledby="feedback-heading" className="space-y-6 pt-4 border-t border-zinc-800">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              Community Voice & Feedback
            </span>
            <span className="text-xs text-zinc-400">• Built with & for you</span>
          </div>
          <h2 id="feedback-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
            Real Community Thoughts, Reviews & Ideas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            VoiceSphere improves through continuous input from disabled advocates, sound designers, and listeners worldwide.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFeedback}
          className="flex-shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs sm:text-sm shadow-md transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Give Your Feedback</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedFilter === 'all'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          All ({feedbackList.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('accessibility')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedFilter === 'accessibility'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          Accessibility
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('audio_quality')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedFilter === 'audio_quality'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          Audio Quality
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('feature_request')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedFilter === 'feature_request'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          Feature Ideas
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter('languages')}
          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
            selectedFilter === 'languages'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          Languages & RTL
        </button>
      </div>

      {/* Feedback Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const badge = getCategoryBadge(item.category);

          return (
            <div
              key={item.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition"
            >
              <div className="space-y-2.5">
                {/* Category & Star Rating */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>

                  <div className="flex items-center space-x-0.5 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < item.rating ? 'fill-yellow-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {item.title}
                </h3>

                {/* Message */}
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "{item.message}"
                </p>
              </div>

              {/* Author & Helpful Reaction */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div>
                  <span className="font-bold text-zinc-200 block truncate max-w-[140px]">
                    {item.userName}
                  </span>
                  {item.userRole && (
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {item.userRole}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleHelpfulClick(item.id)}
                  aria-label={`Mark feedback as helpful (${item.helpfulCount} helpful)`}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-bold">{item.helpfulCount}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
