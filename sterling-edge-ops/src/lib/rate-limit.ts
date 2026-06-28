/**
 * Distributed rate limiter using Upstash Redis when UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN are set; falls back to an in-memory Map for
 * local development. The in-memory fallback is per-instance only — do not
 * rely on it for enforcement in distributed production deployments.
 */

// ── In-memory fallback ────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((entry, key) => {
    if (now > entry.resetAt) memoryStore.delete(key);
  });
}, 5 * 60 * 1000);

function checkMemoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

// ── Upstash distributed limiter ───────────────────────────────────────────────

let upstashLimiter: {
  login: (ip: string) => Promise<boolean>;
  api: (ip: string) => Promise<boolean>;
} | null = null;

function getUpstashLimiter() {
  if (upstashLimiter) return upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Dynamic imports avoid bundling Upstash in builds that don't have it configured
    const { Redis } = require("@upstash/redis");
    const { Ratelimit } = require("@upstash/ratelimit");

    const redis = new Redis({ url, token });

    const loginLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:login",
    });

    const apiLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "rl:api",
    });

    upstashLimiter = {
      login: async (ip: string) => {
        const { success } = await loginLimit.limit(ip);
        return success;
      },
      api: async (ip: string) => {
        const { success } = await apiLimit.limit(ip);
        return success;
      },
    };

    return upstashLimiter;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** 5 login attempts per 15 minutes per IP */
export async function loginRateLimit(ip: string): Promise<boolean> {
  const distributed = getUpstashLimiter();
  if (distributed) return distributed.login(ip);
  return checkMemoryLimit(`login:${ip}`, 5, 15 * 60 * 1000);
}

/** 120 API requests per minute per IP */
export async function apiRateLimit(ip: string): Promise<boolean> {
  const distributed = getUpstashLimiter();
  if (distributed) return distributed.api(ip);
  return checkMemoryLimit(`api:${ip}`, 120, 60 * 1000);
}
