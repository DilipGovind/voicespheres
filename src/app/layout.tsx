import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { I18nProvider } from '@/lib/i18n-context';
import { AuthProvider } from '@/lib/auth-context';
import { ScreenReaderLiveRegion } from '@/components/accessibility/ScreenReaderLiveRegion';
import { SwitchAccessOverlay } from '@/components/accessibility/SwitchAccessOverlay';
import { DyslexiaRuler } from '@/components/accessibility/DyslexiaRuler';

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'VoiceSphere – Global Accessible Voice Community',
  description:
    'A completely free, open-source, privacy-first, globally accessible multilingual social audio platform built for people with and without disabilities.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VoiceSphere',
  },
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
  verification: {
    google: 'i4VOJluuc1_j9QZqLlqTHUFvASZSPdB7WQA464eb4Jg',
  },
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
            <AuthProvider>
              {/* Screen Reader Live Region (NVDA, JAWS, VoiceOver, TalkBack) */}
              <ScreenReaderLiveRegion />

              {/* Switch Access Overlay */}
              <SwitchAccessOverlay />

              {/* Reading Guide Ruler for Dyslexia */}
              <DyslexiaRuler />

              {children}

              {/* PWA Service Worker Registration */}
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                      window.addEventListener('load', function() {
                        navigator.serviceWorker.register('/sw.js').catch(function() {});
                      });
                    }
                  `,
                }}
              />
            </AuthProvider>
          </I18nProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
