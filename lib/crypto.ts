import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption for secrets stored in the database (e.g. the AI API key).
 *
 * Key: SETTINGS_ENCRYPTION_KEY, 32 random bytes encoded as base64
 *      (generate with `openssl rand -base64 32`).
 * Format: "v1:" + base64(iv[12] | authTag[16] | ciphertext)
 *
 * GCM authenticates the data, so any tampering makes decryption throw.
 */

const VERSION = "v1";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionKeyError";
  }
}

export function getEncryptionKey(env: NodeJS.ProcessEnv = process.env): Buffer {
  const raw = env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new EncryptionKeyError(
      "SETTINGS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32`.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new EncryptionKeyError(
      `SETTINGS_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes encoded as base64 (got ${key.length} bytes).`,
    );
  }
  return key;
}

/** True when a valid encryption key is configured. Never throws. */
export function hasEncryptionKey(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    getEncryptionKey(env);
    return true;
  } catch {
    return false;
  }
}

export function encrypt(plaintext: string, key: Buffer = getEncryptionKey()): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, tag, ciphertext]).toString("base64")}`;
}

export function decrypt(payload: string, key: Buffer = getEncryptionKey()): string {
  const [version, data] = payload.split(":");
  if (version !== VERSION || !data) {
    throw new Error("Unsupported encrypted value format.");
  }
  const buffer = Buffer.from(data, "base64");
  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Encrypted value is too short.");
  }
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
