import { APICallError } from "ai";

/** Patterns that look like provider API keys, removed from any message we show or log. */
const KEY_PATTERNS: RegExp[] = [
  /sk-ant-[A-Za-z0-9_-]{8,}/g,
  /sk-or-[A-Za-z0-9_-]{8,}/g,
  /sk-(?:proj-)?[A-Za-z0-9_-]{16,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{12,}/gi,
];
const KEY_PARAM = /\b(x-api-key|api[_-]?key|key)=([^&\s"']+)/gi;

/** Remove the given secrets (and anything key-shaped) from a string. */
export function redactSecrets(
  text: string,
  secrets: Array<string | null | undefined> = [],
): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) out = out.split(secret).join("[redacted]");
  }
  for (const pattern of KEY_PATTERNS) {
    out = out.replace(pattern, "[redacted]");
  }
  return out.replace(KEY_PARAM, (_match, name: string) => `${name}=[redacted]`);
}

/**
 * Turn a provider/SDK error into a short message that is safe to show to the admin
 * and to log. Never includes the API key.
 */
export function sanitizeProviderError(error: unknown, apiKey?: string | null): string {
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;
  if (status === 401 || status === 403) return "The provider rejected the API key (unauthorized).";
  if (status === 404) return "The model was not found. Check the model id for this provider.";
  if (status === 429)
    return "The provider is rate limiting requests, or the account has no credit.";
  if (status !== undefined && status >= 500) return `The provider had a server error (${status}).`;

  const name = error instanceof Error ? error.name : "Error";
  if (name === "AbortError" || name === "TimeoutError") return "The request timed out.";
  const raw = error instanceof Error ? error.message : String(error);
  const message = redactSecrets(raw, [apiKey]).replace(/\s+/g, " ").trim().slice(0, 300);
  if (!message) return "Unknown error.";
  return status ? `Provider error (${status}): ${message}` : message;
}
