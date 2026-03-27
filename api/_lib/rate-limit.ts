import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Simple in-memory rate limiter using a sliding window.
 * Note: On serverless, memory is not shared across invocations,
 * but it still protects against rapid-fire bursts within a single instance.
 * For production-grade rate limiting, use Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store)) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * Rate limit by a key (IP or userId).
 * @param key - Unique identifier (IP address or user ID)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default 60s)
 * @returns true if rate limited (caller should block), false if allowed
 */
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}

/**
 * Get the client IP from the request.
 */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Helper to return a 429 Too Many Requests response.
 */
export function tooManyRequests(res: VercelResponse) {
  return res.status(429).json({
    error: "Too many requests. Please try again later.",
  });
}
