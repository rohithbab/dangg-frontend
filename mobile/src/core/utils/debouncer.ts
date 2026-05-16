/**
 * Coalesces rapid callbacks (e.g. search keystrokes) into a single trailing
 * execution. Always call `dispose()` from `useEffect` cleanup or the
 * consuming component's unmount to cancel any pending timer.
 */
export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly delayMs: number = 350) {}

  /** Schedules `action` after `delayMs`. Each call resets the timer. */
  schedule(action: () => void): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(action, this.delayMs);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null;
  }

  dispose(): void {
    this.cancel();
  }
}
