import Redis from 'ioredis';
import { logger } from './logger';

declare global {
  var redis: Redis | undefined;
}

let redis: Redis | null = null;

function createRedisClient(): Redis | null {
  // Only create Redis client if REDIS_URL is configured
  if (!process.env.REDIS_URL) {
    logger.info('Redis not configured. Using in-memory rate limiting.');
    return null;
  }

  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true;
        }
        return false;
      },
    });

    client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    return null;
  }
}

// Singleton pattern to prevent multiple connections
export function getRedisClient(): Redis | null {
  if (!redis) {
    if (global.redis) {
      redis = global.redis;
    } else {
      redis = createRedisClient();
      if (redis) {
        global.redis = redis;
      }
    }
  }
  return redis;
}

export { redis };
