"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import {
  saveAiSettings,
  testAiConnection,
  type TestConnectionResult,
} from "@/app/actions/aiActions";
import { runAdminAction } from "@/lib/adminFeedback";
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from "@/lib/ai/providerMeta";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

/** Everything the form needs. Contains no secrets (only the last 4 key characters). */
export type AiSettingsView = {
  savedInDatabase: boolean;
  enabled: boolean;
  provider: ProviderId;
  model: string;
  storedKeyLast4: string | null;
  storedKeyProvider: ProviderId | null;
  temperature: number;
  maxOutputTokens: number;
  perMinuteLimit: number;
  dailyLimit: number;
  extraInstructions: string;
  live: boolean;
  keySource: "database" | "env" | null;
  problem: string | null;
  envKeys: Record<ProviderId, boolean>;
  encryptionReady: boolean;
};

export default function AiSettingsForm({ view }: { view: AiSettingsView }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(view.enabled);
  const [provider, setProvider] = useState<ProviderId>(view.provider);
  const [model, setModel] = useState(view.model);
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [temperature, setTemperature] = useState(String(view.temperature));
  const [maxOutputTokens, setMaxOutputTokens] = useState(String(view.maxOutputTokens));
  const [perMinuteLimit, setPerMinuteLimit] = useState(String(view.perMinuteLimit));
  const [dailyLimit, setDailyLimit] = useState(String(view.dailyLimit));
  const [extraInstructions, setExtraInstructions] = useState(view.extraInstructions);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const meta = PROVIDERS[provider];
  const storedKeyApplies = view.storedKeyLast4 !== null && view.storedKeyProvider === provider;
  const providerChangedWithStoredKey =
    view.storedKeyLast4 !== null && view.storedKeyProvider !== provider;

  const changeProvider = (next: ProviderId) => {
    setProvider(next);
    // Suggest that provider's default model unless the admin typed one of its models.
    if (!PROVIDERS[next].suggestedModels.includes(model)) setModel(PROVIDERS[next].defaultModel);
    setTestResult(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await runAdminAction(
      () =>
        saveAiSettings({
          enabled,
          provider,
          model,
          apiKey,
          clearApiKey,
          temperature: Number(temperature),
          maxOutputTokens: Number(maxOutputTokens),
          perMinuteLimit: Number(perMinuteLimit),
          dailyLimit: Number(dailyLimit),
          extraInstructions,
        }),
      "AI settings saved",
    );
    if (ok) {
      setApiKey("");
      setClearApiKey(false);
      router.refresh();
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testAiConnection({ provider, model, apiKey }));
    } catch {
      setTestResult({ ok: false, error: "Request failed. Your session may have expired." });
    }
    setTesting(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Status */}
      <div
        role="status"
        className={`flex items-start gap-3 rounded-lg p-4 text-sm ${
          view.live
            ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
        }`}
      >
        {view.live ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        ) : (
          <XCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        )}
        <div>
          <p className="font-medium">
            {view.live ? "The chatbot is live on the website." : "The chatbot is hidden."}
          </p>
          {view.problem && <p className="mt-1">{view.problem}</p>}
          {view.live && view.keySource === "env" && (
            <p className="mt-1">
              Using the API key from the {PROVIDERS[view.provider].envKey} env var.
            </p>
          )}
          {!view.savedInDatabase && (
            <p className="mt-1">
              No settings saved yet{view.live ? " (running from environment variables)" : ""}.
            </p>
          )}
        </div>
      </div>

      {!view.encryptionReady && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          SETTINGS_ENCRYPTION_KEY is not set on the server, so API keys can&apos;t be saved here.
          Generate one with <code>openssl rand -base64 32</code>, add it to the environment and
          redeploy. Keys from env vars still work.
        </p>
      )}

      <div className="space-y-5 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <label className="flex items-center gap-3 font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          Enable the chatbot on the website
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="ai-provider" className={labelClass}>
              Provider
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => {
                const next = PROVIDER_IDS.find((id) => id === e.target.value);
                if (next) changeProvider(next);
              }}
              className={inputClass}
            >
              {PROVIDER_IDS.map((id) => (
                <option key={id} value={id}>
                  {PROVIDERS[id].label}
                  {view.envKeys[id] ? " (env key set)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-model" className={labelClass}>
              Model
            </label>
            <input
              id="ai-model"
              required
              list="ai-model-suggestions"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id="ai-model-suggestions">
              {meta.suggestedModels.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Suggestions: {meta.suggestedModels.join(", ")}. Any valid model id works.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="ai-key" className={labelClass}>
            API key
          </label>
          <input
            id="ai-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              storedKeyApplies
                ? `••••${view.storedKeyLast4} (leave empty to keep)`
                : view.envKeys[provider]
                  ? `Using ${meta.envKey} (leave empty to keep)`
                  : "Paste your API key"
            }
            className={inputClass}
            autoComplete="new-password"
            spellCheck={false}
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Stored encrypted; never shown again after saving.</span>
            <a
              href={meta.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Get a {meta.label} key <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
          {providerChangedWithStoredKey && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              The stored key (••••{view.storedKeyLast4}) is for{" "}
              {view.storedKeyProvider
                ? PROVIDERS[view.storedKeyProvider].label
                : "another provider"}
              . Saving with {meta.label} removes it.
            </p>
          )}
          {storedKeyApplies && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={clearApiKey}
                onChange={(e) => setClearApiKey(e.target.checked)}
              />
              Remove the stored key{view.envKeys[provider] ? ` (fall back to ${meta.envKey})` : ""}
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !model}
            className={`${secondaryButtonClass} inline-flex items-center gap-2`}
          >
            {testing && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Test connection
          </button>
          <p aria-live="polite" className="text-sm">
            {testResult?.ok === true && (
              <span className="text-green-700 dark:text-green-400">
                Connected in {testResult.latencyMs} ms (key: {testResult.keySource}). Reply: “
                {testResult.reply}”
              </span>
            )}
            {testResult?.ok === false && (
              <span className="text-red-700 dark:text-red-400">{testResult.error}</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="text-lg font-semibold">Behaviour and limits</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="ai-temperature" className={labelClass}>
              Temperature (0–1)
            </label>
            <input
              id="ai-temperature"
              type="number"
              min={0}
              max={1}
              step={0.1}
              required
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-max-tokens" className={labelClass}>
              Max reply tokens
            </label>
            <input
              id="ai-max-tokens"
              type="number"
              min={50}
              max={2000}
              step={1}
              required
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-per-minute" className={labelClass}>
              Messages / minute / visitor
            </label>
            <input
              id="ai-per-minute"
              type="number"
              min={1}
              max={60}
              step={1}
              required
              value={perMinuteLimit}
              onChange={(e) => setPerMinuteLimit(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-per-day" className={labelClass}>
              Messages / day / visitor
            </label>
            <input
              id="ai-per-day"
              type="number"
              min={1}
              max={10000}
              step={1}
              required
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="ai-extra" className={labelClass}>
            Extra instructions (optional)
          </label>
          <textarea
            id="ai-extra"
            rows={4}
            maxLength={2000}
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            placeholder="e.g. Mention that I prefer remote roles in the EU time zone."
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Added to the assistant&apos;s instructions. It still only answers from your portfolio
            content.
          </p>
        </div>
      </div>

      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
