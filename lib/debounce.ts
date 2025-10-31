/**
 * Debounce utility for preventing rapid repeated function calls
 */

/**
 * Debounce a function call
 * @param fn Function to debounce
 * @param delayMs Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle a function call - ensures function is called at most once per interval
 * @param fn Function to throttle
 * @param intervalMs Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= intervalMs) {
      // Enough time has passed, call immediately
      lastCallTime = now;
      fn(...args);
    } else {
      // Schedule a call after the remaining time
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const remainingTime = intervalMs - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn(...args);
        timeoutId = null;
      }, remainingTime);
    }
  };
}
