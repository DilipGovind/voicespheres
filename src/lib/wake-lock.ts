/**
 * Screen Wake Lock Manager
 * Prevents mobile devices from sleeping / locking the screen during active voice rooms,
 * which keeps WebRTC audio streams and background threads active.
 */

class WakeLockManager {
  private sentinel: any = null;
  private isRequested = false;

  public async acquire(): Promise<boolean> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      this.isRequested = true;
      this.sentinel = await (navigator as any).wakeLock.request('screen');

      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
        // Automatically re-acquire if page became visible again and was not explicitly released
        if (this.isRequested && document.visibilityState === 'visible') {
          this.acquire().catch(() => {});
        }
      });

      return true;
    } catch (err) {
      console.warn('[WakeLock] Could not acquire screen wake lock:', err);
      return false;
    }
  }

  public release(): void {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }
  }

  public initVisibilityHandler(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (this.isRequested && document.visibilityState === 'visible' && !this.sentinel) {
        this.acquire().catch(() => {});
      }
    });
  }
}

export const wakeLockManager = new WakeLockManager();
if (typeof window !== 'undefined') {
  wakeLockManager.initVisibilityHandler();
}
