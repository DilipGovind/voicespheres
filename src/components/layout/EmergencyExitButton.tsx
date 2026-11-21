'use client';

import React, { useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { LogOut, AlertTriangle } from 'lucide-react';

interface EmergencyExitButtonProps {
  onExit: () => void;
  roomName?: string;
}

export function EmergencyExitButton({ onExit, roomName }: EmergencyExitButtonProps) {
  const { announce } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger emergency room exit if a modal dialog is currently open
      const hasOpenModal = document.querySelector('[role="dialog"]') !== null;
      if (hasOpenModal && e.key === 'Escape') {
        return;
      }

      // Escape or Alt+Q to trigger emergency leave
      if (e.key === 'Escape' || (e.altKey && (e.key === 'q' || e.key === 'Q'))) {
        announce('Emergency quick exit triggered. Leaving room now.', 'assertive');
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, announce]);

  return (
    <button
      type="button"
      onClick={() => {
        announce('Emergency quick exit triggered. Leaving room now.', 'assertive');
        onExit();
      }}
      aria-label="Emergency Leave Room Button (Press Escape key anytime)"
      className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm border-2 border-red-400 shadow-lg focus:ring-4 focus:ring-red-400 transition"
    >
      <AlertTriangle className="w-4 h-4 text-yellow-300 stroke-[3]" />
      <span>Emergency Exit</span>
      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-red-950 text-red-200 text-[10px] font-mono border border-red-500">
        ESC
      </span>
    </button>
  );
}
