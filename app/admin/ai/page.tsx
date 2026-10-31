import { hasEncryptionKey } from "@/lib/crypto";
import { PROVIDERS } from "@/lib/ai/providerMeta";
import {
  AI_DEFAULTS,
  envKeyStatus,
  loadSettingsRowFresh,
  resolveSettings,
} from "@/lib/ai/getSettings";
import { getUsageStats } from "@/lib/ai/usage";
import AiSettingsForm, { type AiSettingsView } from "./AiSettingsForm";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  const [row, usage] = await Promise.all([loadSettingsRowFresh(), getUsageStats(7)]);
  const resolved = resolveSettings(row);
  const provider = resolved.provider ?? "anthropic";

  // Only non-secret data goes to the client component.
  const view: AiSettingsView = {
    savedInDatabase: row !== null,
    enabled: row?.enabled ?? false,
    provider,
    model: resolved.model || PROVIDERS[provider].defaultModel,
    storedKeyLast4: row?.apiKeyEncrypted ? row.apiKeyLast4 : null,
    storedKeyProvider: row?.apiKeyEncrypted && resolved.provider ? resolved.provider : null,
    temperature: row?.temperature ?? AI_DEFAULTS.temperature,
    maxOutputTokens: row?.maxOutputTokens ?? AI_DEFAULTS.maxOutputTokens,
    perMinuteLimit: row?.perMinuteLimit ?? AI_DEFAULTS.perMinuteLimit,
    dailyLimit: row?.dailyLimit ?? AI_DEFAULTS.dailyLimit,
    extraInstructions: row?.extraInstructions ?? "",
    live: resolved.enabled,
    keySource: resolved.keySource,
    problem: resolved.enabled ? null : resolved.problem,
    envKeys: envKeyStatus(),
    encryptionReady: hasEncryptionKey(),
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold text-fg">AI Chatbot</h2>
      <AiSettingsForm view={view} />
      <section aria-labelledby="usage-heading" className="rounded-lg bg-surface p-6 shadow-sm">
        <h3 id="usage-heading" className="mb-4 text-lg font-semibold">
          Usage (UTC)
        </h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Messages today", usage.today.requests],
            ["Rate-limited today", usage.today.rateLimited],
            ["Errors today", usage.today.errors],
            ["Tokens today (in / out)", `${usage.today.inputTokens} / ${usage.today.outputTokens}`],
            ["Cached input tokens today", usage.today.cachedInputTokens],
            [`Messages (last ${usage.lastDays.days} days)`, usage.lastDays.requests],
            [
              `Tokens (last ${usage.lastDays.days} days)`,
              `${usage.lastDays.inputTokens} / ${usage.lastDays.outputTokens}`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border p-3">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
