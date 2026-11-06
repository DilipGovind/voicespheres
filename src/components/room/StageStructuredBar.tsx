'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { StructuredStage, Participant } from '@/types/room';
import { Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StageStructuredBarProps {
  currentStage: StructuredStage;
  activeSpeaker: Participant | null;
  queue: string[];
  participants: Participant[];
  timeLimitSeconds?: number;
  onAdvanceStage?: (next: StructuredStage) => void;
  isHostOrMod?: boolean;
}

const STAGES: { id: StructuredStage; label: string; step: number }[] = [
  { id: 'INTRO', label: '1. Introduction', step: 1 },
  { id: 'TOPIC', label: '2. Topic Brief', step: 2 },
  { id: 'QUEUE', label: '3. Speaker Queue', step: 3 },
  { id: 'DISCUSSION', label: '4. Open Discussion', step: 4 },
  { id: 'QA', label: '5. Q&A / Clarify', step: 5 },
  { id: 'CLOSING', label: '6. Closing Summary', step: 6 },
];

export function StageStructuredBar({
  currentStage,
  activeSpeaker,
  queue,
  participants,
  timeLimitSeconds = 120,
  onAdvanceStage,
  isHostOrMod = false,
}: StageStructuredBarProps) {
  const { settings } = useAccessibility();
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitSeconds);

  useEffect(() => {
    setSecondsRemaining(timeLimitSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStage, activeSpeaker, timeLimitSeconds]);

  if (!settings.structuredConversationMode) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const queuedParticipants = queue
    .map((id) => participants.find((p) => p.id === id))
    .filter(Boolean) as Participant[];

  const handleNextStage = () => {
    if (!onAdvanceStage) return;
    const nextIdx = (currentStageIndex + 1) % STAGES.length;
    onAdvanceStage(STAGES[nextIdx].id);
  };

  return (
    <div
      role="region"
      aria-label="Structured Conversation Timeline and Speaking Queue"
      className="w-full max-w-5xl mx-auto my-3 p-4 rounded-2xl bg-zinc-950/90 border-2 border-violet-500/50 text-white shadow-xl"
    >
      {/* Stages Progress Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse overflow-x-auto py-1 scrollbar-none">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={s.id}
                className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-2 ring-violet-400'
                    : isCompleted
                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    : 'text-zinc-400 opacity-60'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {isHostOrMod && onAdvanceStage && (
          <button
            type="button"
            onClick={handleNextStage}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow"
          >
            <span>Next Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Speaking Timer & Queue Information */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 gap-3 text-xs md:text-sm">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <Clock className="w-4 h-4 text-violet-400" />
            <span className="text-zinc-400">Current Turn:</span>
            <span className={`font-mono font-bold ${secondsRemaining <= 15 ? 'text-amber-400 animate-pulse' : 'text-zinc-100'}`}>
              {timerDisplay}
            </span>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-zinc-400">Active Speaker:</span>
            <span className="font-bold text-yellow-400">
              {activeSpeaker ? activeSpeaker.name : 'Open Discussion'}
            </span>
          </div>
        </div>

        {/* Turn Queue */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-400">Queue ({queuedParticipants.length}):</span>
          <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {queuedParticipants.length === 0 ? (
              <span className="text-zinc-400 italic">No one in queue</span>
            ) : (
              queuedParticipants.slice(0, 3).map((p, i) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-700"
                >
                  #{i + 1} {p.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
