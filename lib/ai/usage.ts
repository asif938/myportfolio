import "server-only";
import { prisma } from "@/lib/prisma";

const COUNTERS = [
  "requests",
  "rateLimited",
  "errors",
  "inputTokens",
  "outputTokens",
  "cachedInputTokens",
] as const;
type Counter = (typeof COUNTERS)[number];
type UsageDelta = Partial<Record<Counter, number | undefined>>;

/** Midnight UTC of the given day (the AiUsage primary key). */
export function utcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Add to today's counters. Never throws: usage stats must not break the chat. */
export async function recordUsage(delta: UsageDelta): Promise<void> {
  const create: Partial<Record<Counter, number>> = {};
  const update: Partial<Record<Counter, { increment: number }>> = {};
  for (const key of COUNTERS) {
    const value = delta[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      create[key] = Math.round(value);
      update[key] = { increment: Math.round(value) };
    }
  }
  if (Object.keys(create).length === 0) return;

  const day = utcDay();
  try {
    await prisma.aiUsage.upsert({ where: { day }, create: { day, ...create }, update });
  } catch (error) {
    console.error(
      "[ai-usage] failed to record usage:",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

/** Usage for today and the last `days` days. */
export async function getUsageStats(days = 7) {
  const today = utcDay();
  const since = new Date(today.getTime() - (days - 1) * 86_400_000);
  const rows = await prisma.aiUsage.findMany({ where: { day: { gte: since } } });
  const todayRow = rows.find((r) => r.day.getTime() === today.getTime());
  const sum = (key: Counter) => rows.reduce((total, r) => total + r[key], 0);

  return {
    today: {
      requests: todayRow?.requests ?? 0,
      rateLimited: todayRow?.rateLimited ?? 0,
      errors: todayRow?.errors ?? 0,
      inputTokens: todayRow?.inputTokens ?? 0,
      outputTokens: todayRow?.outputTokens ?? 0,
      cachedInputTokens: todayRow?.cachedInputTokens ?? 0,
    },
    lastDays: {
      days,
      requests: sum("requests"),
      inputTokens: sum("inputTokens"),
      outputTokens: sum("outputTokens"),
    },
  };
}
