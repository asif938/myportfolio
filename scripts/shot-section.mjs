#!/usr/bin/env node
/**
 * Screenshot one section at given widths, light + dark, and report horizontal overflow.
 *   node scripts/shot-section.mjs <css-selector> <out-dir> [widths=390,1280] [baseUrl]
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [selector, out, widthsArg = "390,1280", base = "http://localhost:3100"] =
  process.argv.slice(2);
const widths = widthsArg.split(",").map(Number);
mkdirSync(out, { recursive: true });
const name = selector.replace(/[^\w]/g, "");

const browser = await chromium.launch();
for (const mode of ["light", "dark"]) {
  for (const w of widths) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      colorScheme: mode,
    });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    const el = page.locator(selector);
    await el.scrollIntoViewIfNeeded();
    // scroll through so scroll-driven reveals complete
    const h = await el.evaluate((n) => n.getBoundingClientRect().height);
    for (let y = 0; y <= h; y += 300) {
      await el.evaluate(
        (n, dy) =>
          window.scrollTo({
            top: n.getBoundingClientRect().top + scrollY + dy - 300,
            behavior: "instant",
          }),
        y,
      );
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    await page.addStyleTag({ content: "header{visibility:hidden!important}" });
    await el.screenshot({ path: `${out}/${name}-${mode}-${w}.png` });
    console.log(`${mode} ${w}px horizontal overflow: ${overflow}px`);
    await ctx.close();
  }
}
await browser.close();
