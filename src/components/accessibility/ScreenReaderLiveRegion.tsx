'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';

export function ScreenReaderLiveRegion() {
  const { announcements } = useAccessibility();

  const politeAnnouncements = announcements.filter((a) => a.priority === 'polite');
  const assertiveAnnouncements = announcements.filter((a) => a.priority === 'assertive');

  return (
    <div className="sr-only" aria-hidden="false">
      {/* Polite announcements for normal updates (e.g. joined room, captions) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        id="a11y-announcer-polite"
      >
        {politeAnnouncements.map((item) => (
          <p key={item.id}>{item.message}</p>
        ))}
      </div>

      {/* Assertive announcements for urgent alerts (e.g. emergency exit, moderator mute, warnings) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="a11y-announcer-assertive"
      >
        {assertiveAnnouncements.map((item) => (
          <p key={item.id}>{item.message}</p>
        ))}
      </div>
    </div>
  );
}
