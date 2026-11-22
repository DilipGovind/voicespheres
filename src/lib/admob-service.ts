import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  AdMobRewardItem,
  AdmobConsentStatus,
} from '@capacitor-community/admob';

// Official Google AdMob Configuration
export const ADMOB_CONFIG = {
  // Official Production App ID
  APP_ID: process.env.NEXT_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-3988357163009655~5124464939',
  // Official Production Banner Ad Unit ID
  BANNER_ID: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-3988357163009655/9982487053',
  // Official Production Interstitial Ad Unit ID (Room Leave Transition)
  INTERSTITIAL_ID: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3988357163009655/7356323716',
  // Official Production Rewarded Video Ad Unit ID (Community Supporter Badge)
  REWARDED_ID: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3988357163009655/7909364192',

  // Official Google Mobile Ads Sample Test Ad Unit IDs (Guaranteed 100% fill for instant verification)
  TEST_BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  TEST_INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  TEST_REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',

  // Testing flag: false for live production ads, true when explicitly requested
  IS_TESTING: process.env.NEXT_PUBLIC_ADMOB_IS_TESTING === 'true',
  // Minimum interval between interstitial ads (5 minutes = 300,000 ms)
  INTERSTITIAL_COOLDOWN_MS: 300000,
  // Minimum time after app launch before first interstitial can show (60 seconds)
  APP_LAUNCH_COOLDOWN_MS: 60000,
};

export type AdMobBannerState = 'hidden' | 'loading' | 'visible' | 'failed' | 'fallback_test';

export interface AdMobStatus {
  isNative: boolean;
  isInitialized: boolean;
  bannerState: AdMobBannerState;
  isTestMode: boolean;
  lastError: { code?: number; message?: string } | null;
  lastRewardTime: number | null;
}

class AdMobService {
  private isInitialized = false;
  private isBannerShowing = false;
  private lastInterstitialTime = 0;
  private appStartTime = Date.now();
  private hasRewardClaimed = false;
  private isTestModeOverride: boolean | null = null;
  private listenersAttached = false;
  private bannerState: AdMobBannerState = 'hidden';
  private lastError: { code?: number; message?: string } | null = null;
  private lastRewardTime: number | null = null;
  private isFallbackAttempt = false;
  private statusListeners = new Set<(status: AdMobStatus) => void>();

  /**
   * Safe check for native Capacitor Android platform
   */
  public isNative(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  }

  /**
   * Check whether test mode is active (supports override, localStorage, or env)
   */
  public isTesting(): boolean {
    if (this.isTestModeOverride !== null) {
      return this.isTestModeOverride;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('voicesphere_admob_test_mode');
        if (stored !== null) return stored === 'true';
      } catch {}
    }
    return ADMOB_CONFIG.IS_TESTING;
  }

  /**
   * Toggle between production and Google test sample ads
   */
  public setTestMode(enabled: boolean): void {
    this.isTestModeOverride = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voicesphere_admob_test_mode', String(enabled));
      } catch {}
    }
    this.notifyStatus();

    // If banner is active, refresh it with new mode
    if (this.isBannerShowing) {
      this.isFallbackAttempt = false;
      this.hideBanner().then(() => this.showBanner(false));
    }
  }

  /**
   * Get current diagnostic status
   */
  public getStatus(): AdMobStatus {
    return {
      isNative: this.isNative(),
      isInitialized: this.isInitialized,
      bannerState: this.bannerState,
      isTestMode: this.isTesting(),
      lastError: this.lastError,
      lastRewardTime: this.lastRewardTime,
    };
  }

  /**
   * Subscribe to status changes for UI diagnostics
   */
  public subscribe(listener: (status: AdMobStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(): void {
    const current = this.getStatus();
    this.statusListeners.forEach((fn) => {
      try {
        fn(current);
      } catch {}
    });
  }

  /**
   * Attach native plugin lifecycle listeners
   */
  private async attachListeners(): Promise<void> {
    if (!this.isNative() || this.listenersAttached) {
      return;
    }

    try {
      await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('[AdMobService] Banner ad loaded successfully on Android');
        this.isBannerShowing = true;
        this.bannerState = this.isFallbackAttempt ? 'fallback_test' : 'visible';
        this.lastError = null;
        this.notifyStatus();
      });

      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, async (error: any) => {
        console.warn('[AdMobService] Banner ad failed to load from AdMob:', error);
        this.isBannerShowing = false;
        this.lastError = error;
        this.bannerState = 'failed';
        this.notifyStatus();

        // Automatic Smart Fallback:
        // When brand-new production ad units return NO_FILL (code 3) while AdMob is propagating inventory,
        // automatically fall back to Google's official sample test banner unit so the developer/user
        // can immediately verify view placement, responsive sizing, and functionality.
        if (!this.isFallbackAttempt && !this.isTesting()) {
          console.log('[AdMobService] Production banner returned no fill. Triggering Google Sample Test Banner fallback...');
          this.isFallbackAttempt = true;
          this.bannerState = 'fallback_test';
          this.notifyStatus();

          try {
            const fallbackOptions: BannerAdOptions = {
              adId: ADMOB_CONFIG.TEST_BANNER_ID,
              adSize: BannerAdSize.ADAPTIVE_BANNER,
              position: BannerAdPosition.BOTTOM_CENTER,
              margin: 0,
              isTesting: true,
            };
            await AdMob.showBanner(fallbackOptions);
            this.isBannerShowing = true;
          } catch (fallbackErr) {
            console.warn('[AdMobService] Test banner fallback error:', fallbackErr);
          }
        }
      });

      this.listenersAttached = true;
    } catch (err) {
      console.warn('[AdMobService] Could not attach banner listeners:', err);
    }
  }

  /**
   * Initialize Google Mobile Ads SDK through Capacitor plugin
   */
  public async initialize(): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // 1. Request user consent via UMP (User Messaging Platform) for GDPR/CPRA compliance
      try {
        const consentInfo = await AdMob.requestConsentInfo();
        if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
      } catch (consentErr) {
        console.warn('[AdMobService] UMP consent handling notice:', consentErr);
      }

      // 2. Attach native event listeners
      await this.attachListeners();

      // 3. Initialize AdMob with safe parameters
      await AdMob.initialize({
        initializeForTesting: this.isTesting(),
      });

      this.isInitialized = true;
      console.log('[AdMobService] Google Mobile Ads SDK initialized successfully on Android');
      this.notifyStatus();
      return true;
    } catch (err) {
      console.warn('[AdMobService] Initialization failed (running in fallback mode):', err);
      return false;
    }
  }

  /**
   * Display a responsive bottom banner ad on the home/discovery screen.
   * Will NEVER show if an active voice room or conversation is ongoing.
   */
  public async showBanner(isRoomActive = false, forceTesting = false): Promise<boolean> {
    if (!this.isNative() || isRoomActive) {
      return false;
    }

    if (this.isBannerShowing) {
      return true;
    }

    try {
      if (!this.isInitialized) {
        const ok = await this.initialize();
        if (!ok) return false;
      }

      const useTest = forceTesting || this.isTesting();
      const unitId = useTest ? ADMOB_CONFIG.TEST_BANNER_ID : ADMOB_CONFIG.BANNER_ID;

      this.bannerState = 'loading';
      this.notifyStatus();

      const options: BannerAdOptions = {
        adId: unitId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: useTest,
      };

      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      return true;
    } catch (err) {
      console.warn('[AdMobService] Could not request banner ad:', err);
      this.isBannerShowing = false;
      this.bannerState = 'failed';
      this.notifyStatus();
      return false;
    }
  }

  /**
   * Hide and remove the banner ad (e.g. when entering a voice room or full-screen mode)
   */
  public async hideBanner(): Promise<void> {
    if (!this.isNative() || !this.isBannerShowing) {
      this.bannerState = 'hidden';
      this.notifyStatus();
      return;
    }

    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
      this.isBannerShowing = false;
      this.isFallbackAttempt = false;
      this.bannerState = 'hidden';
      this.notifyStatus();
    } catch (err) {
      console.warn('[AdMobService] Could not hide banner ad:', err);
      this.isBannerShowing = false;
      this.bannerState = 'hidden';
      this.notifyStatus();
    }
  }

  /**
   * Display an optional interstitial ad strictly at natural activity transitions (e.g. after leaving a room).
   * NEVER displayed during a live voice conversation, microphone recording, or immediately at app launch.
   */
  public async showInterstitial(
    context: 'room_exit' | 'lobby' | 'manual' = 'room_exit',
    forceTesting = false
  ): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    const now = Date.now();

    // Prevent ads immediately after app launch unless manual testing
    if (context !== 'manual' && now - this.appStartTime < ADMOB_CONFIG.APP_LAUNCH_COOLDOWN_MS) {
      console.log('[AdMobService] Interstitial skipped: launch cooldown active');
      return false;
    }

    // Enforce minimum 5-minute cooldown between interstitials unless manual testing
    if (context !== 'manual' && now - this.lastInterstitialTime < ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
      console.log('[AdMobService] Interstitial skipped: 5-minute cooldown active');
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const useTest = forceTesting || this.isTesting();
      const unitId = useTest ? ADMOB_CONFIG.TEST_INTERSTITIAL_ID : ADMOB_CONFIG.INTERSTITIAL_ID;

      // Prepare interstitial
      await AdMob.prepareInterstitial({
        adId: unitId,
        isTesting: useTest,
      });

      // Show interstitial
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      return true;
    } catch (err) {
      // If production interstitial failed (e.g. No Fill), try test interstitial fallback once
      if (!forceTesting && !this.isTesting()) {
        console.warn('[AdMobService] Production interstitial failed, attempting sample test fallback:', err);
        return this.showInterstitial(context, true);
      }
      console.warn('[AdMobService] Interstitial failed to load or show, proceeding seamlessly:', err);
      return false;
    }
  }

  /**
   * Display an optional rewarded ad (e.g. "Watch ad to support the community and unlock supporter badge").
   * Validates reward callbacks and strictly prevents duplicate reward claims.
   * Core voice and accessibility features are NEVER locked behind this.
   */
  public async showRewarded(
    onRewardEarned: (reward: { type: string; amount: number }) => void,
    forceTesting = false
  ): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.hasRewardClaimed = false;

      const useTest = forceTesting || this.isTesting();
      const unitId = useTest ? ADMOB_CONFIG.TEST_REWARDED_ID : ADMOB_CONFIG.REWARDED_ID;

      // Register one-time reward listener
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: AdMobRewardItem) => {
          if (!this.hasRewardClaimed) {
            this.hasRewardClaimed = true;
            this.lastRewardTime = Date.now();
            this.notifyStatus();
            onRewardEarned({
              type: reward.type || 'community_supporter_badge',
              amount: reward.amount || 1,
            });
          }
        }
      );

      // Prepare rewarded ad
      await AdMob.prepareRewardVideoAd({
        adId: unitId,
        isTesting: useTest,
      });

      // Show rewarded ad
      await AdMob.showRewardVideoAd();

      // Clean up listener after a reasonable timeout
      setTimeout(() => {
        try {
          rewardListener.remove();
        } catch {}
      }, 60000);

      return true;
    } catch (err) {
      // If production rewarded video failed (e.g. No Fill), try test rewarded ad fallback once
      if (!forceTesting && !this.isTesting()) {
        console.warn('[AdMobService] Production rewarded ad failed, attempting sample test fallback:', err);
        return this.showRewarded(onRewardEarned, true);
      }
      console.warn('[AdMobService] Rewarded video failed to load:', err);
      return false;
    }
  }
}

export const admobService = new AdMobService();
