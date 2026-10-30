import { beforeAll, describe, expect, it, vi } from "vitest";
// Vitest doesn't load .env, so no Upstash env vars are set and the in-memory limiter is used.
import { getClientIp, getRateLimiter } from "@/lib/rateLimit";

beforeAll(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("in-memory rate limiter", () => {
  it("allows `limit` requests per window, then blocks", async () => {
    const limiter = getRateLimiter({ prefix: "test-a", limit: 3, window: "1 m" });
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await limiter.limit("1.2.3.4")).success);
    expect(results).toEqual([true, true, true, false]);
  });

  it("counts each identifier separately", async () => {
    const limiter = getRateLimiter({ prefix: "test-b", limit: 1, window: "1 m" });
    expect((await limiter.limit("a")).success).toBe(true);
    expect((await limiter.limit("b")).success).toBe(true);
    expect((await limiter.limit("a")).success).toBe(false);
  });

  it("reuses the same limiter for the same settings, and a new one when the limit changes", async () => {
    const first = getRateLimiter({ prefix: "test-c", limit: 1, window: "1 m" });
    expect(getRateLimiter({ prefix: "test-c", limit: 1, window: "1 m" })).toBe(first);
    await first.limit("x");
    const changed = getRateLimiter({ prefix: "test-c", limit: 2, window: "1 m" });
    expect(changed).not.toBe(first);
    expect((await changed.limit("x")).success).toBe(true);
  });

  it("resets after the window", async () => {
    vi.useFakeTimers();
    const limiter = getRateLimiter({ prefix: "test-d", limit: 1, window: "1 m" });
    expect((await limiter.limit("y")).success).toBe(true);
    expect((await limiter.limit("y")).success).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect((await limiter.limit("y")).success).toBe(true);
    vi.useRealTimers();
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for address", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
