#!/usr/bin/env node
/**
 * Design screenshots -> docs/design/<stage>/. Needs the app running (npm run start -- -p 3100).
 *   node scripts/screenshots.mjs <stage-name> [baseUrl] [--full]
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [stage = "stage-1", base = "http://localhost:3100"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const full = process.argv.includes("--full");
const palette = "prism";
const sizes = [
  { w: 375, h: 812 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
];
const out = `docs/design/${stage}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const mode of ["light", "dark"]) {
  for (const { w, h } of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: mode, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/${palette}-${mode}-${w}.png`, fullPage: full });
    if (w === 375) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.screenshot({ path: `${out}/${palette}-${mode}-${w}-menu.png` });
    }
    if (errors.length) console.log(`console errors @${w} ${mode}:`, errors);
    await ctx.close();
  }
}
await browser.close();
console.log(`saved to ${out}`);
