import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { firstIssue, type ActionResult } from "@/lib/validations";

/**
 * Validate `input` with `schema`, run `fn` with the parsed data, and convert any
 * failure into an ActionResult instead of throwing to the client.
 */
export async function runValidated<S extends z.ZodType>(
  schema: S,
  input: unknown,
  fn: (data: z.output<S>) => Promise<unknown>,
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }
  return runSafely(() => fn(parsed.data));
}

/** Run a database operation and convert errors into an ActionResult. */
export async function runSafely(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "That item no longer exists." };
    }
    console.error("Action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
