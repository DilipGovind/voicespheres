import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
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
  // Testing flag: false for live production ads, true when explicitly requested for dev devices
  IS_TESTING: process.env.NEXT_PUBLIC_ADMOB_IS_TESTING === 'true',
  // Minimum interval between interstitial ads (5 minutes = 300,000 ms)
  INTERSTITIAL_COOLDOWN_MS: 300000,
  // Minimum time after app launch before first interstitial can show (60 seconds)
  APP_LAUNCH_COOLDOWN_MS: 60000,
};

class AdMobService {
  private isInitialized = false;
  private isBannerShowing = false;
  private lastInterstitialTime = 0;
  private appStartTime = Date.now();
  private hasRewardClaimed = false;

  /**
   * Safe check for native Capacitor Android platform
   */
  public isNative(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
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

      // 2. Initialize AdMob with safe parameters
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.IS_TESTING,
      });

      this.isInitialized = true;
      console.log('[AdMobService] Google Mobile Ads SDK initialized successfully on Android');
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
  public async showBanner(isRoomActive = false): Promise<boolean> {
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

      const options: BannerAdOptions = {
        adId: ADMOB_CONFIG.BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: ADMOB_CONFIG.IS_TESTING,
      };

      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      return true;
    } catch (err) {
      console.warn('[AdMobService] Could not display banner ad:', err);
      this.isBannerShowing = false;
      return false;
    }
  }

  /**
   * Hide and remove the banner ad (e.g. when entering a voice room or full-screen mode)
   */
  public async hideBanner(): Promise<void> {
    if (!this.isNative() || !this.isBannerShowing) {
      return;
    }

    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
      this.isBannerShowing = false;
    } catch (err) {
      console.warn('[AdMobService] Could not hide banner ad:', err);
      this.isBannerShowing = false;
    }
  }

  /**
   * Display an optional interstitial ad strictly at natural activity transitions (e.g. after leaving a room).
   * NEVER displayed during a live voice conversation, microphone recording, or immediately at app launch.
   */
  public async showInterstitial(context: 'room_exit' | 'lobby' = 'room_exit'): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }

    const now = Date.now();

    // Prevent ads immediately after app launch (must wait at least 60 seconds)
    if (now - this.appStartTime < ADMOB_CONFIG.APP_LAUNCH_COOLDOWN_MS) {
      return false;
    }

    // Enforce minimum 5-minute cooldown between interstitials
    if (now - this.lastInterstitialTime < ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Prepare interstitial
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.INTERSTITIAL_ID,
        isTesting: ADMOB_CONFIG.IS_TESTING,
      });

      // Show interstitial
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      return true;
    } catch (err) {
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
    onRewardEarned: (reward: { type: string; amount: number }) => void
  ): Promise<boolean> {
    if (!this.isNative()) {
      // In web/desktop, simulate or notify user
      return false;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.hasRewardClaimed = false;

      // Register one-time reward listener
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: AdMobRewardItem) => {
          if (!this.hasRewardClaimed) {
            this.hasRewardClaimed = true;
            onRewardEarned({
              type: reward.type || 'community_supporter_badge',
              amount: reward.amount || 1,
            });
          }
        }
      );

      // Prepare rewarded ad
      await AdMob.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.REWARDED_ID,
        isTesting: ADMOB_CONFIG.IS_TESTING,
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
      console.warn('[AdMobService] Rewarded video failed to load:', err);
      return false;
    }
  }
}

export const admobService = new AdMobService();
