'use client';

import React, { useRef, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { LiveCaptionItem } from '@/types/room';
import { Subtitles, Sparkles, MessageSquare } from 'lucide-react';

interface LiveCaptionsDisplayProps {
  captions: LiveCaptionItem[];
}

export function LiveCaptionsDisplay({ captions }: LiveCaptionsDisplayProps) {
  const { settings } = useAccessibility();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);

  if (!settings.captionsEnabled) return null;

  // Font size classes
  const fontSizes = {
    small: 'text-sm md:text-base',
    medium: 'text-base md:text-lg',
    large: 'text-lg md:text-2xl font-bold',
    'extra-large': 'text-xl md:text-3xl font-black leading-tight',
  }[settings.captionFontSize];

  // Contrast styling
  const contrastStyles = {
    'high-black': 'bg-black text-white border-2 border-white/60 shadow-2xl',
    'high-yellow': 'bg-black text-yellow-300 border-2 border-yellow-400 shadow-2xl',
    standard: 'bg-zinc-950/85 backdrop-blur-md text-zinc-100 border border-zinc-700/80 shadow-xl',
  }[settings.captionContrast];

  const recentCaptions = captions.slice(-4);

  return (
    <div
      role="region"
      aria-label="Live Speech-to-Text Captions"
      aria-live="polite"
      aria-relevant="additions text"
      className="w-full max-w-4xl mx-auto my-3"
    >
      <div className={`p-4 md:p-5 rounded-2xl transition-all ${contrastStyles}`}>
        {/* Caption Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-xs font-bold opacity-80 uppercase tracking-wider">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Subtitles className="w-4 h-4 text-cyan-400" />
            <span>Live Real-Time Captions</span>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700">
            {captions.length} Transcribed Events
          </span>
        </div>

        {/* Captions Content */}
        {recentCaptions.length === 0 ? (
          <div className="py-2 text-center text-sm opacity-60 italic">
            Listening for conversation... speak into your microphone or use AAC to generate captions.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentCaptions.map((cap) => (
              <div key={cap.id} className="flex items-start space-x-2.5 rtl:space-x-reverse">
                {cap.isAac ? (
                  <span
                    aria-label="Synthesized AAC speech"
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-black uppercase bg-emerald-500 text-black border border-emerald-400 mt-1"
                  >
                    AAC
                  </span>
                ) : (
                  <span
                    aria-label="Spoken audio"
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-black uppercase bg-cyan-500 text-black border border-cyan-400 mt-1"
                  >
                    MIC
                  </span>
                )}

                <div className="flex-1">
                  <span className="font-extrabold mr-2 rtl:ml-2 rtl:mr-0 underline decoration-cyan-400/50">
                    {cap.speakerName}:
                  </span>
                  <span className={fontSizes}>{cap.text}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
