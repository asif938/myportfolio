import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { redactSecrets, sanitizeProviderError } from "@/lib/ai/sanitizeError";

const apiKey = "sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function apiError(statusCode: number, message: string) {
  return new APICallError({
    message,
    url: "https://api.example.com",
    requestBodyValues: {},
    statusCode,
  });
}

describe("redactSecrets", () => {
  it("removes the given key", () => {
    expect(redactSecrets(`bad key ${apiKey}!`, [apiKey])).toBe("bad key [redacted]!");
  });

  it("removes key-shaped strings even when the key is unknown", () => {
    const out = redactSecrets(
      "keys: sk-proj-abcdefghijklmnopqrstuvwxyz AIzaSyA1234567890abcdefghijklmnop Bearer abcdefghijklmnop ?key=secret123",
    );
    expect(out).not.toMatch(/sk-proj-abc|AIzaSy|Bearer abcdef|secret123/);
  });
});

describe("sanitizeProviderError", () => {
  it("maps auth errors to a plain message", () => {
    expect(sanitizeProviderError(apiError(401, `invalid x-api-key ${apiKey}`), apiKey)).toBe(
      "The provider rejected the API key (unauthorized).",
    );
  });

  it("maps 404 and 429", () => {
    expect(sanitizeProviderError(apiError(404, "nope"))).toMatch(/model was not found/);
    expect(sanitizeProviderError(apiError(429, "slow down"))).toMatch(/rate limiting/);
  });

  it("never echoes the key in other errors", () => {
    const message = sanitizeProviderError(new Error(`request failed with ${apiKey}`), apiKey);
    expect(message).not.toContain(apiKey);
    expect(message).toContain("[redacted]");
  });

  it("truncates very long messages", () => {
    expect(sanitizeProviderError(new Error("x".repeat(1000))).length).toBeLessThanOrEqual(300);
  });
});
