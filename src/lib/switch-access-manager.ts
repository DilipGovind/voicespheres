export class SwitchAccessManager {
  private static instance: SwitchAccessManager;
  private isScanning = false;
  private scanTimer: any = null;
  private currentIndex = 0;
  private scanElements: HTMLElement[] = [];
  private scanInterval = 1800; // ms
  private onHighlightCallback: ((el: HTMLElement | null) => void) | null = null;
  private dwellTimeout: any = null;
  private isDwellEnabled = false;
  private dwellDuration = 1200;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  public static getInstance(): SwitchAccessManager {
    if (!SwitchAccessManager.instance) {
      SwitchAccessManager.instance = new SwitchAccessManager();
    }
    return SwitchAccessManager.instance;
  }

  public setConfig(options: {
    interval?: number;
    dwellEnabled?: boolean;
    dwellDuration?: number;
    onHighlight?: (el: HTMLElement | null) => void;
  }) {
    if (options.interval) this.scanInterval = options.interval;
    if (options.dwellEnabled !== undefined) this.isDwellEnabled = options.dwellEnabled;
    if (options.dwellDuration) this.dwellDuration = options.dwellDuration;
    if (options.onHighlight) this.onHighlightCallback = options.onHighlight;
  }

  public refreshElements() {
    if (typeof document === 'undefined') return;
    const selector =
      'button:not([disabled]):not([aria-hidden="true"]), ' +
      'a[href]:not([aria-hidden="true"]), ' +
      'input:not([disabled]):not([type="hidden"]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      '[role="button"]:not([aria-disabled="true"]), ' +
      '[tabindex="0"]';

    const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
    // Filter visible elements
    this.scanElements = all.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });

    if (this.currentIndex >= this.scanElements.length) {
      this.currentIndex = 0;
    }
  }

  public startScan() {
    if (this.isScanning) return;
    this.refreshElements();
    if (this.scanElements.length === 0) return;

    this.isScanning = true;
    this.highlightCurrent();

    this.scanTimer = setInterval(() => {
      this.advanceScan();
    }, this.scanInterval);
  }

  public stopScan() {
    this.isScanning = false;
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    this.clearCurrentHighlight();
    this.onHighlightCallback?.(null);
  }

  public advanceScan() {
    this.refreshElements();
    if (this.scanElements.length === 0) return;

    this.clearCurrentHighlight();
    this.currentIndex = (this.currentIndex + 1) % this.scanElements.length;
    this.highlightCurrent();
  }

  public selectCurrent() {
    if (this.scanElements.length === 0) return;
    const el = this.scanElements[this.currentIndex];
    if (el) {
      // Visual feedback pulse
      el.classList.add('ring-4', 'ring-emerald-400');
      setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-400'), 250);
      el.click();
      el.focus();
    }
  }

  private highlightCurrent() {
    const el = this.scanElements[this.currentIndex];
    if (el) {
      el.classList.add('switch-scan-focused');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.onHighlightCallback?.(el);
    }
  }

  private clearCurrentHighlight() {
    const el = this.scanElements[this.currentIndex];
    if (el) {
      el.classList.remove('switch-scan-focused');
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // If user presses Spacebar or Enter while Switch Scanning is active and not inside an input text field
    const activeTag = document.activeElement?.tagName.toLowerCase();
    const isEditing = activeTag === 'input' || activeTag === 'textarea';

    if (this.isScanning && !isEditing) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.selectCurrent();
      }
    }
  };

  // Dwell-click helper
  public handleMouseEnter(el: HTMLElement) {
    if (!this.isDwellEnabled) return;
    this.clearDwell();
    this.dwellTimeout = setTimeout(() => {
      el.click();
    }, this.dwellDuration);
  }

  public clearDwell() {
    if (this.dwellTimeout) {
      clearTimeout(this.dwellTimeout);
      this.dwellTimeout = null;
    }
  }
}
