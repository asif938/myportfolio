import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { decrypt, hasEncryptionKey } from "@/lib/crypto";
import { PROVIDERS, PROVIDER_IDS, isProviderId, type ProviderId } from "@/lib/ai/providerMeta";

export const AI_SETTINGS_TAG = "ai-settings";
export const AI_SETTINGS_ID = "default";

export const AI_DEFAULTS = {
  temperature: 0.3,
  maxOutputTokens: 500,
  perMinuteLimit: 10,
  dailyLimit: 50,
};

/** Uncached row, for the admin page and Server Actions. */
export function loadSettingsRowFresh() {
  return prisma.aiSettings.findUnique({ where: { id: AI_SETTINGS_ID } });
}

/**
 * Only the database row is cached. It holds the *encrypted* key; decryption happens
 * per call so the plaintext key never lands in the data cache.
 */
const loadSettingsRow = unstable_cache(loadSettingsRowFresh, ["ai-settings-row"], {
  tags: [AI_SETTINGS_TAG],
  revalidate: 3600,
});

export type KeySource = "database" | "env" | null;

/** Server-only: contains the decrypted API key. Never pass to client components. */
export type ResolvedAiSettings = {
  enabled: boolean;
  provider: ProviderId | null;
  model: string;
  apiKey: string | null;
  keySource: KeySource;
  temperature: number;
  maxOutputTokens: number;
  perMinuteLimit: number;
  dailyLimit: number;
  extraInstructions: string | null;
  /** Why the chatbot is unavailable, if it is. Safe to show to the admin. */
  problem: string | null;
};

export function envKeyFor(provider: ProviderId): string | null {
  return process.env[PROVIDERS[provider].envKey]?.trim() || null;
}

/** Which providers have an API key in the environment (booleans only). */
export function envKeyStatus(): Record<ProviderId, boolean> {
  const status = {} as Record<ProviderId, boolean>;
  for (const id of PROVIDER_IDS) status[id] = envKeyFor(id) !== null;
  return status;
}

type SettingsRow = Awaited<ReturnType<typeof loadSettingsRowFresh>>;

export function resolveSettings(row: SettingsRow): ResolvedAiSettings {
  // 1. Settings saved in the admin panel.
  if (row) {
    const provider = isProviderId(row.provider) ? row.provider : null;
    let apiKey: string | null = null;
    let keySource: KeySource = null;
    let problem: string | null = null;

    if (!provider) {
      problem = `Unknown provider "${row.provider}".`;
    } else if (row.apiKeyEncrypted) {
      try {
        apiKey = decrypt(row.apiKeyEncrypted);
        keySource = "database";
      } catch {
        problem = hasEncryptionKey()
          ? "The stored API key could not be decrypted (was SETTINGS_ENCRYPTION_KEY changed?). Enter the key again."
          : "SETTINGS_ENCRYPTION_KEY is missing, so the stored API key cannot be read.";
      }
    } else {
      apiKey = envKeyFor(provider);
      keySource = apiKey ? "env" : null;
      if (!apiKey) problem = `No API key: add one here or set ${PROVIDERS[provider].envKey}.`;
    }

    if (!row.enabled && !problem) problem = "The chatbot is switched off.";
    return {
      enabled: row.enabled && provider !== null && apiKey !== null && row.model.length > 0,
      provider,
      model: row.model,
      apiKey,
      keySource,
      temperature: row.temperature,
      maxOutputTokens: row.maxOutputTokens,
      perMinuteLimit: row.perMinuteLimit,
      dailyLimit: row.dailyLimit,
      extraInstructions: row.extraInstructions,
      problem,
    };
  }

  // 2. Fallback: environment variables (AI_PROVIDER, AI_MODEL, <PROVIDER>_API_KEY).
  const envProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const provider = isProviderId(envProvider) ? envProvider : null;
  const apiKey = provider ? envKeyFor(provider) : null;
  let problem: string | null = null;
  if (!provider) problem = "Not configured yet. Set it up below (or with AI_PROVIDER / AI_MODEL).";
  else if (!apiKey) problem = `No API key: set ${PROVIDERS[provider].envKey} or add one below.`;

  return {
    enabled: provider !== null && apiKey !== null,
    provider,
    model: provider ? process.env.AI_MODEL?.trim() || PROVIDERS[provider].defaultModel : "",
    apiKey,
    keySource: apiKey ? "env" : null,
    ...AI_DEFAULTS,
    extraInstructions: null,
    problem,
  };
}

/** Settings for the chat route (cached row + per-call decryption). */
export async function getAiSettings(): Promise<ResolvedAiSettings> {
  return resolveSettings(await loadSettingsRow());
}

/** Whether the public chat widget should be shown. Never throws. */
export async function isChatAvailable(): Promise<boolean> {
  try {
    return (await getAiSettings()).enabled;
  } catch {
    return false;
  }
}
