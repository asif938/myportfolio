#!/usr/bin/env node
/**
 * Design screenshots -> docs/design/<name>/. Needs the app running (npm run qa:start).
 * Captures the home page, /projects, a project page and the 404 at 375 / 768 / 1440 in light
 * and dark (only the home page is captured full-length with --full). The page is scrolled through first so scroll reveals have finished.
 *   node scripts/screenshots.mjs <name> [baseUrl] [--full]
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [name = "final", base = "http://localhost:3100"] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const full = process.argv.includes("--full");
const palette = "prism";
const sizes = [
  { w: 375, h: 812 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
];
const out = `docs/design/${name}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();

// Find a real project page to include.
const probe = await (await browser.newContext()).newPage();
await probe.goto(`${base}/projects`, { waitUntil: "load" });
const projectHref = await probe.locator('a[href^="/projects/"]').first().getAttribute("href");
await probe.context().close();

const pages = [
  ["home", "/"],
  ["projects", "/projects"],
  ["project", projectHref],
  ["404", "/page-that-does-not-exist"],
].filter(([, url]) => url);

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await document.fonts.ready;
  });
  // scroll-driven reveals are tied to the scroll position: show the settled state for the capture
  await page.addStyleTag({
    content: ".edu-reveal{animation:none!important;opacity:1!important;transform:none!important}",
  });
  await page.waitForTimeout(500);
}

for (const mode of ["light", "dark"]) {
  for (const { w, h } of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: mode });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const [label, url] of pages) {
      await page.goto(base + url, { waitUntil: "load" });
      await page.waitForTimeout(1200);
      await settle(page);
      await page.screenshot({
        path: `${out}/${label}-${palette}-${mode}-${w}.png`,
        fullPage: full && label === "home",
      });
    }
    // mobile menu
    if (w === 375) {
      await page.goto(base, { waitUntil: "load" });
      await page.waitForTimeout(1200);
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.screenshot({ path: `${out}/menu-${palette}-${mode}-${w}.png` });
    }
    if (errors.length) console.log(`console errors @${w} ${mode}:`, errors);
    await ctx.close();
  }
}
await browser.close();
console.log(`saved to ${out}`);
