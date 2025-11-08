// Simple in-memory rate limiter
// For production, use Redis or a proper rate limiting service

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  return true;
}

export function getRateLimitStatus(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const entry = rateLimitMap.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: 100,
      resetAt: now + 60000,
    };
  }

  return {
    allowed: entry.count < 100,
    remaining: Math.max(0, 100 - entry.count),
    resetAt: entry.resetAt,
  };
}

// Preset rate limit configs
export const RATE_LIMITS = {
  BUILD: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 builds per hour
  CREATE_GAME: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 games per hour
  COMMENT: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 comments per hour
  REPORT: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 reports per hour
  API: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

