/**
 * In-memory rate limiter — best-effort in serverless environments.
 * For distributed production use, replace with @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}, 5 * 60 * 1000);

/**
 * Returns true if the request is allowed, false if it should be rejected.
 * @param key     — unique identifier (e.g. IP address or "ip:route")
 * @param limit   — maximum requests per window
 * @param windowMs — window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/** Preset: 5 login attempts per 15 minutes per IP */
export function loginRateLimit(ip: string): boolean {
  return checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
}

/** Preset: 120 API requests per minute per IP */
export function apiRateLimit(ip: string): boolean {
  return checkRateLimit(`api:${ip}`, 120, 60 * 1000);
}
