/**
 * Retry utility with exponential backoff
 * Provides robust retry logic for API calls and network operations
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Promise that resolves with the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Log retry attempt (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retry attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`);
      }

      // Wait before retrying
      await sleep(delay);

      // Exponential backoff with max delay cap
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable based on common patterns
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network errors
  }

  if (error instanceof Response) {
    // Retry on server errors (5xx) or rate limiting (429)
    return error.status >= 500 || error.status === 429;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: string };

    // Retry on server errors or specific error codes
    if (err.status && (err.status >= 500 || err.status === 429)) {
      return true;
    }

    // Retry on network-related error codes
    if (err.code && ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code)) {
      return true;
    }
  }

  return false;
}

/**
 * Retry fetch requests with exponential backoff
 */
export async function retryFetch(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);

      // Throw on HTTP errors so they can be retried
      if (!response.ok && isRetryableError(response)) {
        throw response;
      }

      return response;
    },
    {
      ...retryOptions,
      shouldRetry: (error) => {
        // Use custom shouldRetry if provided, otherwise use default
        if (retryOptions?.shouldRetry) {
          return retryOptions.shouldRetry(error);
        }
        return isRetryableError(error);
      },
    }
  );
}
