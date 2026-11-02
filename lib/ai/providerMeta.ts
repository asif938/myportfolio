/**
 * Provider whitelist metadata. Safe to import in client components (no SDK imports).
 * The matching model factories live in lib/ai/providers.ts (server only).
 */

export const PROVIDER_IDS = ["anthropic", "openai", "google", "openrouter"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderMeta = {
  label: string;
  /** Env var used as a fallback API key. */
  envKey: string;
  defaultModel: string;
  /** Model ids taken from the installed AI SDK provider docs; any valid id can be typed. */
  suggestedModels: string[];
  keyUrl: string;
};

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    label: "Anthropic (Claude)",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-haiku-5-5",
    suggestedModels: ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-haiku-4-5"],
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-5.4-mini",
    suggestedModels: ["gpt-5.4-mini", "gpt-5.4-nano", "gpt-5.5"],
    keyUrl: "https://platform.openai.com/api-keys",
  },
  google: {
    label: "Google (Gemini)",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    defaultModel: "gemini-3.5-flash-lite",
    suggestedModels: ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"],
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openrouter: {
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    defaultModel: "openrouter/auto",
    suggestedModels: ["openrouter/auto"],
    keyUrl: "https://openrouter.ai/settings/keys",
  },
};

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && PROVIDER_IDS.some((id) => id === value);
}
