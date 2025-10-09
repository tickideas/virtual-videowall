import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator } = options;

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = keyGenerator ? keyGenerator(request) : getClientIp(request);
    const now = Date.now();

    // Clean up old entries
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null;
    }

    if (entry.count >= max) {
      // Rate limit exceeded - provide user-friendly message
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
      
      let message = 'Too many requests. Please try again later.';
      
      // Provide more specific messages based on the rate limit type
      if (key.includes('auth')) {
        message = `Too many login attempts. Please wait ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? 's' : ''} before trying again.`;
      } else if (key.includes('session')) {
        message = `Too many connection attempts. Please wait ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? 's' : ''} before trying again.`;
      } else if (key.includes('church')) {
        message = `Too many requests. Please wait ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? 's' : ''} before trying again.`;
      }
      
      return NextResponse.json(
        { 
          error: message,
          retryAfter: retryAfterSeconds,
          type: 'rate_limit'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': retryAfterSeconds.toString(),
          }
        }
      );
    }

    // Increment counter
    entry.count++;
    
    // Add rate limit headers to successful requests
    const remaining = max - entry.count;
    return NextResponse.next({
      headers: {
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': entry.resetTime.toString(),
      }
    });
  };
}

function getClientIp(request: NextRequest): string {
  // Get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default IP (in production, this should be more sophisticated)
  return 'unknown';
}

// Predefined rate limit configurations - adjusted for church use case
export const rateLimits = {
  // More lenient auth limit for churches (people may forget passwords)
  auth: createRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
    max: 10, // 10 attempts per 5 minutes (increased from 5)
    keyGenerator: (request) => {
      const ip = getClientIp(request);
      const url = new URL(request.url);
      return `auth:${ip}:${url.pathname}`;
    }
  }),

  // General API limit - reasonable for normal usage
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 150, // 150 requests per minute (increased from 100)
    keyGenerator: (request) => {
      const ip = getClientIp(request);
      return `api:${ip}`;
    }
  }),

  // More lenient session join limit for churches
  session: createRateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes (reduced from 5)
    max: 15, // 15 session joins per 2 minutes (increased from 10)
    keyGenerator: (request) => {
      const ip = getClientIp(request);
      return `session:${ip}`;
    }
  }),

  // Church-specific limit - more reasonable for active usage
  church: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute (increased from 20)
    keyGenerator: (request) => {
      const ip = getClientIp(request);
      return `church:${ip}`;
    }
  })
};
