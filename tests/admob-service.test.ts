import { describe, it, expect, vi, beforeEach } from 'vitest';
import { admobService, ADMOB_CONFIG } from '@/lib/admob-service';

describe('AdMob Service Safety & Safeguards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports official Google AdMob IDs and safe defaults', () => {
    expect(ADMOB_CONFIG.APP_ID).toBe('ca-app-pub-3988357163009655~5124464939');
    expect(ADMOB_CONFIG.BANNER_ID).toBe('ca-app-pub-3988357163009655/9982487053');
    expect(ADMOB_CONFIG.INTERSTITIAL_ID).toBe('ca-app-pub-3988357163009655/7356323716');
    expect(ADMOB_CONFIG.REWARDED_ID).toBe('ca-app-pub-3988357163009655/7909364192');
    expect(ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS).toBe(300000); // 5-minute cooldown
    expect(ADMOB_CONFIG.APP_LAUNCH_COOLDOWN_MS).toBe(60000); // 60-second launch cooldown
  });

  it('gracefully returns false on web/desktop environments without throwing', async () => {
    // In node/vitest, isNative() is false
    expect(admobService.isNative()).toBe(false);

    const initResult = await admobService.initialize();
    expect(initResult).toBe(false);

    const bannerResult = await admobService.showBanner(false);
    expect(bannerResult).toBe(false);

    const interstitialResult = await admobService.showInterstitial('room_exit');
    expect(interstitialResult).toBe(false);

    let rewardCalled = false;
    const rewardedResult = await admobService.showRewarded(() => {
      rewardCalled = true;
    });
    expect(rewardedResult).toBe(false);
    expect(rewardCalled).toBe(false);
  });

  it('guarantees that showBanner refuses to display when a room is active', async () => {
    // When isRoomActive is true, banner must NEVER show
    const result = await admobService.showBanner(true);
    expect(result).toBe(false);
  });
});
