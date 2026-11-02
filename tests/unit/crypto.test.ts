import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  EncryptionKeyError,
  decrypt,
  encrypt,
  getEncryptionKey,
  hasEncryptionKey,
} from "@/lib/crypto";

const key = randomBytes(32);
const envWith = (value?: string) =>
  (value === undefined ? {} : { SETTINGS_ENCRYPTION_KEY: value }) as NodeJS.ProcessEnv;

describe("encrypt/decrypt", () => {
  it("round-trips a value", () => {
    const secret = "sk-ant-api03-example-secret-value";
    expect(decrypt(encrypt(secret, key), key)).toBe(secret);
  });

  it("round-trips unicode and empty strings", () => {
    expect(decrypt(encrypt("কী: 🔑", key), key)).toBe("কী: 🔑");
    expect(decrypt(encrypt("", key), key)).toBe("");
  });

  it("uses a random IV, so the same input encrypts differently", () => {
    expect(encrypt("same", key)).not.toBe(encrypt("same", key));
  });

  it("does not contain the plaintext", () => {
    const secret = "plain-text-secret-123456";
    expect(encrypt(secret, key)).not.toContain(secret);
  });

  it("detects tampering with the ciphertext", () => {
    const data = Buffer.from(encrypt("secret", key).split(":")[1], "base64");
    data[data.length - 1] ^= 0x01;
    expect(() => decrypt(`v1:${data.toString("base64")}`, key)).toThrow();
  });

  it("detects tampering with the auth tag", () => {
    const data = Buffer.from(encrypt("secret", key).split(":")[1], "base64");
    data[12] ^= 0x01; // first byte of the tag
    expect(() => decrypt(`v1:${data.toString("base64")}`, key)).toThrow();
  });

  it("fails with the wrong key", () => {
    expect(() => decrypt(encrypt("secret", key), randomBytes(32))).toThrow();
  });

  it("rejects unknown formats", () => {
    expect(() => decrypt("v2:abc", key)).toThrow();
    expect(() => decrypt("not-encrypted", key)).toThrow();
  });
});

describe("getEncryptionKey", () => {
  it("reads a 32-byte base64 key", () => {
    const env = envWith(key.toString("base64"));
    expect(getEncryptionKey(env).equals(key)).toBe(true);
    expect(hasEncryptionKey(env)).toBe(true);
  });

  it("fails loudly when missing", () => {
    expect(() => getEncryptionKey(envWith())).toThrow(EncryptionKeyError);
    expect(hasEncryptionKey(envWith())).toBe(false);
  });

  it("fails loudly when the key has the wrong length", () => {
    expect(() => getEncryptionKey(envWith(randomBytes(16).toString("base64")))).toThrow(/32 bytes/);
  });
});
