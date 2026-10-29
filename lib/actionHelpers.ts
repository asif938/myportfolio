import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { firstIssue, reorderSchema, type ActionResult } from "@/lib/validations";

/** Throw inside an action to return `message` to the admin as a validation-style error. */
export class ActionError extends Error {}

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
    if (error instanceof ActionError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return { ok: false, error: "That item no longer exists." };
      if (error.code === "P2002") return { ok: false, error: "That value is already in use." };
    }
    console.error("Action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Validate an ordered id list and write `order = index` for each id. */
export function runReorder(
  input: unknown,
  update: (id: string, order: number) => Prisma.PrismaPromise<unknown>,
  transaction: (ops: Prisma.PrismaPromise<unknown>[]) => Promise<unknown>,
): Promise<ActionResult> {
  return runValidated(reorderSchema, input, (ids) =>
    transaction(ids.map((id, index) => update(id, index))),
  );
}

/** Next `order` value so new items go to the end of the list. */
export function nextOrder(max: number | null): number {
  return max === null ? 0 : max + 1;
}
