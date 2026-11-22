'use client';

import React, { useState, useEffect } from 'react';
import { admobService, AdMobStatus, ADMOB_CONFIG } from '@/lib/admob-service';
import { useAccessibility } from '@/lib/accessibility-context';

export function CommunitySupporterSection() {
  const { announce } = useAccessibility();
  const [admobStatus, setAdmobStatus] = useState<AdMobStatus>(admobService.getStatus());
  const [isSupporter, setIsSupporter] = useState(false);
  const [isWatchingReward, setIsWatchingReward] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for existing supporter badge
    try {
      const stored = localStorage.getItem('voicesphere_supporter_badge');
      if (stored === 'true') {
        setIsSupporter(true);
      }
    } catch {}

    const unsubscribe = admobService.subscribe((status) => {
      setAdmobStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const handleWatchRewarded = async () => {
    setIsWatchingReward(true);
    setActionMessage('Loading sponsor message...');
    announce('Loading sponsor message...', 'polite');

    const success = await admobService.showRewarded((reward) => {
      setIsSupporter(true);
      try {
        localStorage.setItem('voicesphere_supporter_badge', 'true');
      } catch {}
      const msg = 'Thank you! You earned the VoiceSphere Community Supporter badge!';
      setActionMessage(msg);
      announce(msg, 'assertive');
    });

    setIsWatchingReward(false);
    if (!success) {
      const errMsg = 'Could not load rewarded video at this time. Please try again shortly.';
      setActionMessage(errMsg);
      announce(errMsg, 'assertive');
    }
  };

  const handleTestInterstitial = async () => {
    setActionMessage('Preparing interstitial transition...');
    announce('Preparing interstitial transition...', 'polite');
    const success = await admobService.showInterstitial('manual', true);
    if (success) {
      setActionMessage('Interstitial displayed successfully.');
    } else {
      setActionMessage('Interstitial could not be shown.');
    }
  };

  const handleToggleTestMode = () => {
    const nextMode = !admobStatus.isTestMode;
    admobService.setTestMode(nextMode);
    const msg = nextMode
      ? 'Switched to Google Sample Test Ads (100% Fill Rate).'
      : 'Switched to Official Production AdMob Units.';
    setActionMessage(msg);
    announce(msg, 'polite');
  };

  const handleReloadBanner = async () => {
    setActionMessage('Reloading banner ad...');
    await admobService.hideBanner();
    const ok = await admobService.showBanner(false);
    setActionMessage(ok ? 'Banner requested.' : 'Could not reload banner.');
  };

  return (
    <section
      aria-labelledby="supporter-heading"
      className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 sm:p-6 backdrop-blur-sm shadow-xl space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
              Community Powered
            </span>
            {isSupporter && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                🏆 Verified Supporter
              </span>
            )}
          </div>
          <h2 id="supporter-heading" className="text-lg sm:text-xl font-bold text-white">
            Support Inclusive Voice Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
            VoiceSphere is 100% free and open for people with disabilities, families, and caregivers.
            Optionally watch a short sponsor message to help fund low-latency WebRTC servers and real-time captioning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleWatchRewarded}
            disabled={isWatchingReward}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            aria-label="Watch optional 15-second sponsor message to earn Community Supporter badge"
          >
            <span>🌟</span>
            <span>{isWatchingReward ? 'Connecting...' : 'Watch Sponsor Message'}</span>
          </button>

          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
            aria-expanded={showDiagnostics}
            aria-label="Toggle AdMob real-time diagnostics"
          >
            ⚙️ AdMob Info
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          className="text-xs px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 flex items-center justify-between"
        >
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-zinc-400 hover:text-white ml-2 text-sm"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* AdMob Diagnostic Drawer */}
      {showDiagnostics && (
        <div className="pt-4 border-t border-zinc-800 space-y-3 text-xs text-zinc-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Platform</span>
              <span className="font-semibold text-white">
                {admobStatus.isNative ? 'Android Native (Capacitor)' : 'Web Browser'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">AdMob SDK</span>
              <span className="font-semibold text-white">
                {admobStatus.isInitialized ? 'Initialized ✅' : 'Pending / Fallback'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Banner Status</span>
              <span
                className={`font-semibold ${
                  admobStatus.bannerState === 'visible'
                    ? 'text-emerald-400'
                    : admobStatus.bannerState === 'fallback_test'
                    ? 'text-yellow-400'
                    : admobStatus.bannerState === 'failed'
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }`}
              >
                {admobStatus.bannerState === 'visible' && 'Active (Live Production) 🟢'}
                {admobStatus.bannerState === 'fallback_test' && 'Active (Google Test Fallback) 🟡'}
                {admobStatus.bannerState === 'loading' && 'Requesting Ad... ⏳'}
                {admobStatus.bannerState === 'failed' && 'Load Error (See Info) 🔴'}
                {admobStatus.bannerState === 'hidden' && 'Hidden (Room Active or Web)'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
              <span className="text-zinc-500 block">Ad Mode</span>
              <span className="font-semibold text-white">
                {admobStatus.isTestMode ? 'Google Sample Test' : 'Official Production'}
              </span>
            </div>
          </div>

          {admobStatus.lastError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>⚠️</span>
                <span>AdMob Notice (Code {admobStatus.lastError.code ?? 'N/A'}):</span>
              </div>
              <p className="text-xs text-amber-100">
                {admobStatus.lastError.code === 3 ? (
                  <>
                    <strong>Google AdMob Error 3 (No Fill):</strong> Your AdMob ad units were created recently and are currently propagating across Google&apos;s bidding network (this standard propagation takes 24–48 hours). In the meantime, VoiceSphere automatically serves Google&apos;s sample test ads so you can visually verify the banner and layouts.
                  </>
                ) : (
                  admobStatus.lastError.message || 'Ad could not be filled by Google AdMob network.'
                )}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleToggleTestMode}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-600 transition-colors"
            >
              Toggle Mode: {admobStatus.isTestMode ? 'Switch to Production IDs' : 'Switch to Test Sample Ads'}
            </button>
            <button
              onClick={handleReloadBanner}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-600 transition-colors"
            >
              🔄 Reload Banner
            </button>
            <button
              onClick={handleTestInterstitial}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-600 transition-colors"
            >
              📺 Test Interstitial
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 pt-1 font-mono">
            App ID: {ADMOB_CONFIG.APP_ID} | Banner: {ADMOB_CONFIG.BANNER_ID}
          </div>
        </div>
      )}
    </section>
  );
}
