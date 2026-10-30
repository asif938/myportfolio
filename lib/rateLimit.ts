import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = { success: boolean; reset: number };

export interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);
let warned = false;

function warnMissingUpstashOnce() {
  if (warned) return;
  warned = true;
  const msg =
    "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set; using in-memory rate limiting.";
  if (process.env.NODE_ENV === "production") {
    console.error(`${msg} This is NOT reliable on serverless deployments.`);
  } else {
    console.warn(msg);
  }
}

function durationToMs(duration: Duration): number {
  const match = /^(\d+)\s?(ms|s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Unsupported duration: ${duration}`);
  const unit = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return Number(match[1]) * (unit ?? 1);
}

/** Fixed-window limiter kept in process memory. Only for local development. */
function createMemoryLimiter(limit: number, window: Duration): RateLimiter {
  const windowMs = durationToMs(window);
  const hits = new Map<string, { count: number; reset: number }>();

  return {
    async limit(identifier) {
      const now = Date.now();
      const entry = hits.get(identifier);
      if (!entry || entry.reset <= now) {
        hits.set(identifier, { count: 1, reset: now + windowMs });
        return { success: true, reset: now + windowMs };
      }
      entry.count += 1;
      return { success: entry.count <= limit, reset: entry.reset };
    },
  };
}

/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Falls back to an in-memory limiter (with a warning) when Upstash is not configured.
 */
export function createRateLimiter(options: {
  prefix: string;
  limit: number;
  window: Duration;
}): RateLimiter {
  if (!hasUpstash) {
    const memory = createMemoryLimiter(options.limit, options.window);
    return {
      limit(identifier) {
        warnMissingUpstashOnce();
        return memory.limit(identifier);
      },
    };
  }

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    prefix: `portfolio:${options.prefix}`,
  });

  return {
    async limit(identifier) {
      const { success, reset } = await ratelimit.limit(identifier);
      return { success, reset };
    },
  };
}

const limiterCache = new Map<string, RateLimiter>();

/**
 * Like createRateLimiter, but reuses one limiter per (prefix, limit, window).
 * Use this when the limit comes from settings that can change at runtime.
 */
export function getRateLimiter(options: {
  prefix: string;
  limit: number;
  window: Duration;
}): RateLimiter {
  const key = `${options.prefix}:${options.limit}:${options.window}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = createRateLimiter({ ...options, prefix: key });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined;

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: HeaderSource): string {
  const read = (name: string): string | undefined => {
    if (!headers) return undefined;
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const forwarded = read("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || read("x-real-ip")?.trim() || "unknown";
}
