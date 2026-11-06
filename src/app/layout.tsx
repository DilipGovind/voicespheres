import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { I18nProvider } from '@/lib/i18n-context';
import { ScreenReaderLiveRegion } from '@/components/accessibility/ScreenReaderLiveRegion';
import { SwitchAccessOverlay } from '@/components/accessibility/SwitchAccessOverlay';
import { DyslexiaRuler } from '@/components/accessibility/DyslexiaRuler';

export const metadata: Metadata = {
  title: 'VoiceSphere – Global Accessible Voice Community',
  description:
    'A completely free, open-source, privacy-first, globally accessible multilingual social audio platform built for people with and without disabilities.',
  keywords: [
    'accessibility',
    'voice community',
    'a11y',
    'AAC',
    'live captions',
    'screen reader',
    'switch access',
    'inclusive audio',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-yellow-400 selection:text-black">
        <AccessibilityProvider>
          <I18nProvider>
            {/* Screen Reader Live Region (NVDA, JAWS, VoiceOver, TalkBack) */}
            <ScreenReaderLiveRegion />

            {/* Switch Access Overlay */}
            <SwitchAccessOverlay />

            {/* Reading Guide Ruler for Dyslexia */}
            <DyslexiaRuler />

            {children}
          </I18nProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
