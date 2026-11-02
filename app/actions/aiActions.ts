"use server";

import { generateText } from "ai";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { ActionError, runValidated } from "@/lib/actionHelpers";
import { decrypt, encrypt, hasEncryptionKey } from "@/lib/crypto";
import { PROVIDERS } from "@/lib/ai/providerMeta";
import { createModel } from "@/lib/ai/providers";
import { sanitizeProviderError } from "@/lib/ai/sanitizeError";
import {
  AI_SETTINGS_ID,
  AI_SETTINGS_TAG,
  envKeyFor,
  loadSettingsRowFresh,
} from "@/lib/ai/getSettings";
import {
  aiConnectionSchema,
  aiSettingsSchema,
  firstIssue,
  type ActionResult,
} from "@/lib/validations";

export async function saveAiSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const result = await runValidated(aiSettingsSchema, input, async (data) => {
    const existing = await loadSettingsRowFresh();
    const providerChanged = existing !== null && existing.provider !== data.provider;

    // Work out which key to store.
    let apiKeyEncrypted = existing?.apiKeyEncrypted ?? null;
    let apiKeyLast4 = existing?.apiKeyLast4 ?? null;
    if (data.clearApiKey || providerChanged) {
      // A stored key belongs to one provider; never reuse it for another.
      apiKeyEncrypted = null;
      apiKeyLast4 = null;
    }
    if (data.apiKey) {
      if (!hasEncryptionKey()) {
        throw new ActionError(
          "SETTINGS_ENCRYPTION_KEY is not set on the server, so API keys can't be stored. Add it and redeploy.",
        );
      }
      apiKeyEncrypted = encrypt(data.apiKey);
      apiKeyLast4 = data.apiKey.slice(-4);
    }

    const hasKey = apiKeyEncrypted !== null || envKeyFor(data.provider) !== null;
    if (data.enabled && !hasKey) {
      throw new ActionError(
        `Add an API key for ${PROVIDERS[data.provider].label} before enabling the chatbot.`,
      );
    }

    const values = {
      enabled: data.enabled,
      provider: data.provider,
      model: data.model,
      apiKeyEncrypted,
      apiKeyLast4,
      temperature: data.temperature,
      maxOutputTokens: data.maxOutputTokens,
      perMinuteLimit: data.perMinuteLimit,
      dailyLimit: data.dailyLimit,
      extraInstructions: data.extraInstructions,
    };
    await prisma.aiSettings.upsert({
      where: { id: AI_SETTINGS_ID },
      create: { id: AI_SETTINGS_ID, ...values },
      update: values,
    });
  });

  if (result.ok) {
    revalidateTag(AI_SETTINGS_TAG);
    revalidatePath("/admin/ai");
  }
  return result;
}

export type TestConnectionResult =
  | { ok: true; reply: string; latencyMs: number; keySource: "entered" | "stored" | "env" }
  | { ok: false; error: string };

/**
 * Send a tiny prompt with the given provider/model. Uses the key typed in the form,
 * otherwise the stored key (same provider only), otherwise the env var.
 * The key is never returned.
 */
export async function testAiConnection(input: unknown): Promise<TestConnectionResult> {
  await requireAdmin();

  const parsed = aiConnectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { provider, model, apiKey: enteredKey } = parsed.data;

  let apiKey: string | null = null;
  let keySource: "entered" | "stored" | "env" = "entered";
  if (enteredKey) {
    apiKey = enteredKey;
  } else {
    const row = await loadSettingsRowFresh();
    if (row?.apiKeyEncrypted && row.provider === provider) {
      try {
        apiKey = decrypt(row.apiKeyEncrypted);
        keySource = "stored";
      } catch {
        return { ok: false, error: "The stored API key could not be decrypted. Enter it again." };
      }
    } else {
      apiKey = envKeyFor(provider);
      keySource = "env";
    }
  }
  if (!apiKey) {
    return { ok: false, error: `No API key available for ${PROVIDERS[provider].label}.` };
  }

  const started = Date.now();
  try {
    const { text } = await generateText({
      model: createModel(provider, apiKey, model),
      prompt: 'Reply with exactly: "OK"',
      maxOutputTokens: 32,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(20_000),
    });
    return {
      ok: true,
      reply: text.trim().slice(0, 60) || "(empty reply)",
      latencyMs: Date.now() - started,
      keySource,
    };
  } catch (error) {
    return { ok: false, error: sanitizeProviderError(error, apiKey) };
  }
}
