'use client';

import React, { useEffect, useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { SwitchAccessManager } from '@/lib/switch-access-manager';
import { Play, Pause, Power } from 'lucide-react';

export function SwitchAccessOverlay() {
  const { settings, isSwitchScanActive, setIsSwitchScanActive } = useAccessibility();
  const [highlightedText, setHighlightedText] = useState<string>('');

  useEffect(() => {
    const manager = SwitchAccessManager.getInstance();
    manager.setConfig({
      interval: settings.switchScanInterval,
      dwellEnabled: settings.dwellClickEnabled,
      dwellDuration: settings.dwellDelay,
      onHighlight: (el) => {
        if (el) {
          const text = el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || 'Target';
          setHighlightedText(text.slice(0, 32));
        } else {
          setHighlightedText('');
        }
      },
    });

    if (settings.switchAccessEnabled && isSwitchScanActive) {
      manager.startScan();
    } else {
      manager.stopScan();
    }

    return () => {
      manager.stopScan();
    };
  }, [settings.switchAccessEnabled, settings.switchScanInterval, settings.dwellClickEnabled, settings.dwellDelay, isSwitchScanActive]);

  if (!settings.switchAccessEnabled) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-2xl bg-zinc-950/95 border-2 border-sky-400 text-white shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <div className={`w-3 h-3 rounded-full ${isSwitchScanActive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
          Switch Access
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsSwitchScanActive(!isSwitchScanActive)}
        className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow transition"
      >
        {isSwitchScanActive ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Scan</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            <span>Start Scan</span>
          </>
        )}
      </button>

      {isSwitchScanActive && (
        <div className="text-xs text-zinc-300 font-medium border-l border-zinc-700 pl-3 rtl:border-r rtl:border-l-0 rtl:pr-3">
          <span className="text-sky-300 font-semibold">SPACE / ENTER</span> selects:{' '}
          <span className="text-yellow-400 font-bold">{highlightedText || '...'}</span>
        </div>
      )}
    </div>
  );
}
