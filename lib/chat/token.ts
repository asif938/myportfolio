import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Bytes of randomness in a visitor token (256 bits). */
export const VISITOR_TOKEN_BYTES = 32;

/** SHA-256 of the token, hex encoded. This is the only form stored in the database. */
export function hashVisitorToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** A new random visitor token (base64url) and its hash. */
export function generateVisitorToken(): { token: string; hash: string } {
  const token = randomBytes(VISITOR_TOKEN_BYTES).toString("base64url");
  return { token, hash: hashVisitorToken(token) };
}

/** Constant-time check that `token` matches the stored hash. */
export function verifyVisitorToken(token: string | null | undefined, storedHash: string): boolean {
  if (!token || token.length > 200) return false;
  const actual = Buffer.from(hashVisitorToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
