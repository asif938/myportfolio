#!/usr/bin/env node
/**
 * Motion / chrome checks against a running app (default http://localhost:3100):
 *  - scroll-progress bar value at top / middle / bottom, hidden on /login
 *  - <meta name="theme-color"> follows the manual theme toggle
 *  - running infinite animations with and without prefers-reduced-motion
 *  - cumulative layout shift (CLS) on load
 *  - progress-bar and favicon screenshots into docs/design/stage-5/
 *   node scripts/verify-motion.mjs [baseUrl]
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const out = "docs/design/stage-5";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed++;
};

async function open(opts) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(base, { waitUntil: "networkidle" });
  return { ctx, page };
}
const bar = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('div[style*="--progress-bg"]');
    return el ? Number(/scaleX\(([\d.]+)\)/.exec(el.style.transform)?.[1] ?? NaN) : null;
  });

/* progress bar + theme-color + CLS (light) */
{
  const { ctx, page } = await open({ colorScheme: "light" });
  check((await bar(page)) === 0, "progress bar starts at 0");
  await page.evaluate(() =>
    window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2),
  );
  await page.waitForTimeout(200);
  const mid = await bar(page);
  check(mid > 0.4 && mid < 0.6, `progress bar ~50% mid-page (${mid?.toFixed(2)})`);
  await page.screenshot({
    path: `${out}/progress-light-mid.png`,
    clip: { x: 0, y: 0, width: 1280, height: 120 },
  });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  check((await bar(page)) >= 0.99, "progress bar full at the bottom");

  await page.evaluate(() => window.scrollTo(0, 0));
  const tc = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content),
    );
  const before = await tc();
  // cycle system -> light -> dark with the real toggle
  const toggle = page.locator("header button[aria-label*='theme']").first();
  for (let i = 0; i < 3; i++) {
    await toggle.click();
    await page.waitForTimeout(250);
    if (await page.evaluate(() => document.documentElement.classList.contains("dark"))) break;
  }
  const after = await tc();
  check(
    after.every((c) => c.toLowerCase() === "#080616"),
    `theme-color follows manual dark toggle (${before.join("|")} -> ${after.join("|")})`,
  );
  await page.waitForTimeout(500);
  await page.evaluate(() =>
    window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2),
  );
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${out}/progress-dark-mid.png`,
    clip: { x: 0, y: 0, width: 1280, height: 120 },
  });
  const cls = await page.evaluate(() => window.__cls);
  check(cls < 0.05, `CLS on load ${cls.toFixed(4)} (< 0.05)`);
  await ctx.close();
}

/* hidden on /login */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  check((await bar(page)) === null, "progress bar not rendered on /login");
  await ctx.close();
}

/* infinite animations: normal vs reduced motion */
const infinite = (page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter(
        (a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity,
      )
      .map((a) => a.animationName ?? a.constructor.name),
  );
{
  const normal = await open({ reducedMotion: "no-preference" });
  const n = await infinite(normal.page);
  check(
    n.length > 0,
    `normal motion: ${n.length} decorative animations run (${[...new Set(n)].join(", ")})`,
  );
  await normal.ctx.close();
  const reduced = await open({ reducedMotion: "reduce" });
  const r = await infinite(reduced.page);
  check(
    r.length === 0,
    `reduced motion: ${r.length} infinite animations running ${r.length ? "(" + r.join(", ") + ")" : ""}`,
  );
  const cursor = await reduced.page.evaluate(
    () => getComputedStyle(document.querySelector(".cursor"), "::after").animationName,
  );
  check(
    cursor === "none" || (cursor === "blink" && (await infinite(reduced.page)).length === 0),
    `reduced motion: cursor static (${cursor})`,
  );
  const smooth = await reduced.page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  check(smooth === "auto", `reduced motion: scroll-behavior ${smooth}`);
  await reduced.ctx.close();
}

/* favicon */
{
  const ctx = await browser.newContext({ viewport: { width: 400, height: 220 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/icon.svg`);
  const ok = await page.evaluate(() => document.querySelector("svg") !== null);
  check(ok, "favicon /icon.svg serves valid SVG");
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;display:flex;gap:24px;align-items:center;justify-content:center;background:#fff"><img src="/icon.svg" width="128" height="128"><img src="/icon.svg" width="32" height="32"><img src="/icon.svg" width="16" height="16"></div>';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/favicon.png` });
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall motion checks passed");
process.exit(failed ? 1 : 0);
