/**
 * Rotate the admin password.
 *
 *   npm run admin:password -- <username>
 *
 * Prompts for the new password (input hidden). In non-interactive shells it reads
 * ADMIN_NEW_PASSWORD from the environment instead. Uses DATABASE_URL from .env,
 * so check which database that points to before running.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;
const MIN_LENGTH = 12;

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    let muted = false;
    output._writeToOutput = (s: string) => {
      if (!muted || s.includes("\n") || s.includes("\r")) process.stdout.write(muted ? "\n" : s);
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

async function getNewPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    const fromEnv = process.env.ADMIN_NEW_PASSWORD;
    if (!fromEnv)
      throw new Error("Not a terminal: set ADMIN_NEW_PASSWORD to provide the new password.");
    return fromEnv;
  }
  const first = await askHidden("New password: ");
  const second = await askHidden("Repeat new password: ");
  if (first !== second) throw new Error("Passwords do not match.");
  return first;
}

async function main() {
  const username = (process.argv[2] ?? process.env.ADMIN_USERNAME ?? "").trim();
  if (!username) {
    throw new Error("Usage: npm run admin:password -- <username>  (or set ADMIN_USERNAME)");
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`No user named "${username}".`);

  const password = await getNewPassword();
  if (password.length < MIN_LENGTH) {
    throw new Error(`Password must be at least ${MIN_LENGTH} characters long.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, BCRYPT_COST) },
  });
  console.log(`Password updated for "${username}".`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
