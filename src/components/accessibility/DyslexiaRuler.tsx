'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';

export function DyslexiaRuler() {
  const { settings } = useAccessibility();
  const [topPos, setTopPos] = useState<number>(200);

  useEffect(() => {
    if (!settings.readingRuler) return;

    const handleMouseMove = (e: MouseEvent) => {
      setTopPos(e.clientY - 24);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [settings.readingRuler]);

  if (!settings.readingRuler) return null;

  return (
    <div
      aria-hidden="true"
      className="reading-ruler-overlay"
      style={{ top: `${topPos}px` }}
    />
  );
}
