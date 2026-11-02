import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Throws unless the request comes from a signed-in admin.
 * Server Actions are public POST endpoints, so every action must call this first.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}
