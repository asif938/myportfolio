#!/usr/bin/env node
/**
 * axe-core accessibility audit of the public pages in light and dark, at mobile and desktop width.
 * axe-core is not a project dependency; install it for the run only:
 *   npm install --no-save axe-core @playwright/test
 *   node scripts/a11y-axe.mjs [baseUrl]
 * Exits 1 when any serious or critical violation (or any violation with --strict) is found.
 */
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const strict = process.argv.includes("--strict");
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
  "utf8",
);

const browser = await chromium.launch();

// Real URLs: the first project detail page comes from the projects listing.
const probe = await (await browser.newContext()).newPage();
await probe.goto(`${base}/projects`, { waitUntil: "load" });
const projectHref = await probe.locator('a[href^="/projects/"]').first().getAttribute("href");
await probe.context().close();

const pages = [
  ["home", "/"],
  ["projects", "/projects"],
  ["project detail", projectHref],
  ["404", "/not-a-page"],
  ["login", "/login"],
].filter(([, url]) => url);
let blocking = 0;

for (const [name, url] of pages) {
  for (const mode of ["light", "dark"]) {
    for (const width of [390, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: mode });
      const page = await ctx.newPage();
      await page.goto(base + url, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      // reveal everything, then audit the settled page
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, 50));
        }
        scrollTo({ top: 0, behavior: "instant" });
      });
      await page.waitForTimeout(600);
      // scroll-driven reveals depend on scroll position: audit the settled state
      await page.addStyleTag({
        content:
          ".edu-reveal{animation:none!important;opacity:1!important;transform:none!important}",
      });
      await page.evaluate(axeSource);
      const results = await page.evaluate(() =>
        // eslint-disable-next-line no-undef
        axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
          },
        }),
      );
      const violations = results.violations;
      const worst = violations.filter((v) => ["serious", "critical"].includes(v.impact));
      blocking += strict ? violations.length : worst.length;
      console.log(
        `${name} · ${mode} · ${width}px: ${violations.length} violation(s), ${worst.length} serious/critical`,
      );
      for (const v of violations) {
        console.log(`   [${v.impact}] ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 3))
          console.log(
            `        ${n.target.join(" ")}  ${(n.failureSummary ?? "").split("\n")[1] ?? ""}`,
          );
      }
      await ctx.close();
    }
  }
}
await browser.close();
console.log(
  blocking ? `\n${blocking} blocking violation(s)` : "\nno blocking accessibility violations",
);
process.exit(blocking ? 1 : 0);
