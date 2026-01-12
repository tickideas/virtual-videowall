import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback store
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

/**
 * Redis-based rate limiting with in-memory fallback
 * Scales horizontally when Redis is configured
 */
async function checkRateLimitRedis(
  key: string,
  windowMs: number,
  max: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redis = getRedisClient();

  if (!redis) {
    // Fallback to in-memory
    return checkRateLimitMemory(key, windowMs, max);
  }

  try {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    // Get count after removing old entries (index 1 in results)
    const count = (results[1][1] as number) || 0;
    const allowed = count < max;
    const remaining = Math.max(0, max - count - 1);
    const resetTime = now + windowMs;

    return { allowed, remaining, resetTime };
  } catch (error) {
    logger.error('Redis rate limit error, falling back to memory:', error);
    return checkRateLimitMemory(key, windowMs, max);
  }
}

/**
 * In-memory rate limiting fallback
 */
function checkRateLimitMemory(
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; remaining: number; resetTime: number } {
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
    const resetTime = now + windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return { allowed: true, remaining: max - 1, resetTime };
  }

  const allowed = entry.count < max;
  const remaining = Math.max(0, max - entry.count - 1);

  if (allowed) {
    entry.count++;
  }

  return { allowed, remaining, resetTime: entry.resetTime };
}

export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator } = options;

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = keyGenerator ? keyGenerator(request) : getClientIp(request);

    // Check rate limit using Redis (or in-memory fallback)
    const { allowed, remaining, resetTime } = await checkRateLimitRedis(key, windowMs, max);

    if (!allowed) {
      // Rate limit exceeded - provide user-friendly message
      const now = Date.now();
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);
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
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': retryAfterSeconds.toString(),
          }
        }
      );
    }

    // Return null to allow the request to proceed
    return null;
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
