import { expect, test, type Page } from "@playwright/test";

/** Collects console errors and uncaught exceptions for the lifetime of a page. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

/** Scroll through the whole page so scroll-reveals finish before measuring. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

test.describe("home page", () => {
  test("renders every section without console errors or horizontal overflow", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await scrollThrough(page);

    for (const id of ["home", "about", "skills", "education", "projects", "contact"]) {
      await expect(page.locator(`section#${id}`), `section #${id}`).toBeAttached();
    }
    await expect(page.locator("h1")).toHaveCount(1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "horizontal overflow (px)").toBe(0);
    expect(errors, "console errors").toEqual([]);
  });

  test("uses the prism palette and follows the system color scheme", async ({ browser }) => {
    for (const scheme of ["light", "dark"] as const) {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto("/");
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-palette", "prism");
      if (scheme === "dark") await expect(html).toHaveClass(/\bdark\b/);
      else await expect(html).not.toHaveClass(/\bdark\b/);
      await context.close();
    }
  });

  test("theme toggle switches to dark and the browser theme-color follows", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /theme/i }).first();
    await expect(toggle).toBeVisible();
    for (let i = 0; i < 3; i++) {
      if (await page.evaluate(() => document.documentElement.classList.contains("dark"))) break;
      await toggle.click();
      await page.waitForTimeout(250);
    }
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll('meta[name="theme-color"]')).map((m) =>
            m.getAttribute("content"),
          ),
        ),
      )
      .toEqual(expect.arrayContaining(["#080616"]));
    await context.close();
  });

  test("scroll-progress bar grows with the scroll position", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator('div[style*="--progress-bg"]');
    const value = async () =>
      Number(/scaleX\(([\d.]+)\)/.exec((await bar.getAttribute("style")) ?? "")?.[1] ?? NaN);
    expect(await value()).toBe(0);
    await page.evaluate(() =>
      window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2),
    );
    await expect.poll(value).toBeGreaterThan(0.3);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(value).toBeGreaterThan(0.97);
  });

  test("desktop navigation jumps to a section and marks it current", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "desktop nav only");
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Projects" })
      .click();
    await expect(page.locator("#projects")).toBeInViewport();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "location");
  });

  test("mobile menu opens, lists links and closes with Escape", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mobile menu only");
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Contact" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

test.describe("projects", () => {
  test("filter chips narrow the list and announce it", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");
    const cards = page.locator("article");
    const total = await cards.count();
    test.skip(total < 2, "needs at least two projects");

    const chips = page.getByRole("group", { name: "Filter by technology" }).getByRole("button");
    test.skip((await chips.count()) < 2, "needs filter chips");
    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute("aria-pressed", "true");
    expect(await cards.count()).toBeLessThanOrEqual(total);
    await chips.first().click();
    await expect(cards).toHaveCount(total);
  });

  test("a project detail page renders with one h1 and a back link", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/projects");
    const link = page.locator('a[href^="/projects/"]').first();
    await link.click();
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
    expect(errors, "console errors").toEqual([]);
  });
});

test("unknown routes show the themed 404", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/not found/i);
  await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
});

test("login page renders its form without a scroll-progress bar", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.locator('div[style*="--progress-bg"]')).toHaveCount(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no decorative animation keeps running and the cursor is static", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity,
        )
        .map((a) => (a as CSSAnimation).animationName ?? "unnamed"),
    );
    expect(running, "infinite animations still running").toEqual([]);
    const cursorAnimation = await page.evaluate(
      () => getComputedStyle(document.querySelector(".cursor")!, "::after").animationName,
    );
    expect(cursorAnimation).toBe("none");
  });
});
