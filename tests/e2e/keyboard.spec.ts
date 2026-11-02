import { expect, test, type Page } from "@playwright/test";

type Stop = { tag: string; label: string; visibleFocus: boolean; inViewport: boolean };

/** Describes the focused element and whether it shows a visible focus indicator. */
async function focusedStop(page: Page): Promise<Stop | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    // Components with their own ring use box-shadow (Tailwind ring-*).
    const ring = style.boxShadow !== "none" && /rgb/.test(style.boxShadow);
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      label: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || "")
        .trim()
        .slice(0, 40),
      visibleFocus: outline || ring,
      inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
    };
  });
}

test.describe("keyboard walkthrough (desktop)", () => {
  test.beforeEach(({}, info) =>
    test.skip(info.project.name !== "desktop", "keyboard walkthrough runs on desktop"),
  );

  test("skip link is the first stop and moves focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const first = await focusedStop(page);
    expect(first?.label).toMatch(/skip to main content/i);
    expect(first?.visibleFocus, "skip link visible when focused").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("every tab stop is visibly focused and scrolled into view, with no keyboard trap", async ({
    page,
  }) => {
    await page.goto("/");
    const stops: Stop[] = [];
    let reachedFooter = false;
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press("Tab");
      // The page scrolls smoothly: wait until the focused element has been scrolled into view.
      await page
        .waitForFunction(
          () => {
            const el = document.activeElement;
            if (!el || el === document.body) return true;
            const r = el.getBoundingClientRect();
            return r.bottom > 0 && r.top < window.innerHeight;
          },
          null,
          { timeout: 3000 },
        )
        .catch(() => {});
      const stop = await focusedStop(page);
      if (!stop) break;
      stops.push(stop);
      if (await page.evaluate(() => !!document.activeElement?.closest("footer")))
        reachedFooter = true;
    }
    const missingFocus = stops.filter((s) => !s.visibleFocus).map((s) => `${s.tag} "${s.label}"`);
    const offscreen = stops.filter((s) => !s.inViewport).map((s) => `${s.tag} "${s.label}"`);
    expect(stops.length, "number of tab stops").toBeGreaterThan(10);
    expect(missingFocus, "elements without a visible focus indicator").toEqual([]);
    expect(offscreen, "focused elements outside the viewport").toEqual([]);
    expect(reachedFooter, "focus can travel all the way to the footer").toBe(true);
  });

  test("shift+tab walks back to the skip link", async ({ page }) => {
    await page.goto("/");
    // 6 Tabs land on stop #6 (the skip link is stop #1), so 5 Shift+Tabs return to it.
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
    for (let i = 0; i < 5; i++) await page.keyboard.press("Shift+Tab");
    expect((await focusedStop(page))?.label).toMatch(/skip to main content/i);
  });

  test("theme toggle works with Enter and Space", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /theme/i }).first();
    await toggle.focus();
    const before = await toggle.getAttribute("aria-label");
    await page.keyboard.press("Enter");
    await expect(toggle).not.toHaveAttribute("aria-label", before ?? "");
    const middle = await toggle.getAttribute("aria-label");
    await page.keyboard.press("Space");
    await expect(toggle).not.toHaveAttribute("aria-label", middle ?? "");
    await context.close();
  });

  test("chat launcher opens with Enter, closes with Escape and returns focus", async ({ page }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: /^Open chat/ });
    test.skip((await launcher.count()) === 0, "chatbot is disabled in this environment");
    await launcher.focus();
    await page.keyboard.press("Enter");
    const panel = page.locator("#chat-panel");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: /chat/i }).first()).toBeFocused();
  });

  test("contact form fields are reachable and labelled", async ({ page }) => {
    await page.goto("/");
    for (const label of ["Your Name", "Your Email", "Subject", "Message"]) {
      const field = page.getByLabel(label, { exact: true });
      await field.focus();
      await expect(field).toBeFocused();
    }
  });
});
