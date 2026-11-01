#!/usr/bin/env node
/**
 * Runs `next build` / `next start` against a separate output folder (.next-qa) so QA and the
 * Playwright tests never collide with a `next dev` session, which writes to .next.
 *   node scripts/next-qa.mjs build
 *   node scripts/next-qa.mjs start -p 3100
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const [command, ...args] = process.argv.slice(2);
if (!["build", "start"].includes(command)) {
  console.error("usage: node scripts/next-qa.mjs <build|start> [next options]");
  process.exit(1);
}

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, ...args], {
  stdio: "inherit",
  env: { ...process.env, NEXT_DIST_DIR: ".next-qa" },
});
child.on("exit", (code) => process.exit(code ?? 1));
