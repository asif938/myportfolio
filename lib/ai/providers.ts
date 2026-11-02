import "server-only";
import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { PROVIDERS, type ProviderId, type ProviderMeta } from "@/lib/ai/providerMeta";

type ProviderEntry = ProviderMeta & {
  createModel: (apiKey: string, modelId: string) => LanguageModel;
};

/**
 * Whitelisted providers. Only the API key and model id are configurable;
 * base URLs are always the providers' defaults.
 */
export const PROVIDER_REGISTRY: Record<ProviderId, ProviderEntry> = {
  anthropic: {
    ...PROVIDERS.anthropic,
    createModel: (apiKey, modelId) => createAnthropic({ apiKey })(modelId),
  },
  openai: {
    ...PROVIDERS.openai,
    createModel: (apiKey, modelId) => createOpenAI({ apiKey })(modelId),
  },
  google: {
    ...PROVIDERS.google,
    createModel: (apiKey, modelId) => createGoogleGenerativeAI({ apiKey })(modelId),
  },
  openrouter: {
    ...PROVIDERS.openrouter,
    createModel: (apiKey, modelId) => createOpenRouter({ apiKey }).chat(modelId),
  },
};

export function createModel(provider: ProviderId, apiKey: string, modelId: string): LanguageModel {
  return PROVIDER_REGISTRY[provider].createModel(apiKey, modelId);
}
