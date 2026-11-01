# Stage 6 QA report

Measured on the isolated production build (`npm run qa:build` then `npm run qa:start`, port 3100),
Prism palette, light and dark. Tools: Lighthouse 12 via `npx` (not a project dependency), axe-core via
`npm install --no-save`, Playwright (devDependency).

## Lighthouse (home page, plan target: mobile Performance 90+, CLS < 0.05)

| Run      | Performance | Accessibility | Best practices | SEO | LCP   | TBT    | CLS   |
| -------- | ----------- | ------------- | -------------- | --- | ----- | ------ | ----- |
| Mobile 1 | **94**      | 100           | 100            | 100 | 3.0 s | 40 ms  | 0.001 |
| Mobile 2 | **93**      | 100           | 100            | 100 | 3.0 s | 90 ms  | 0.001 |
| Mobile 3 | **92**      | 100           | 100            | 100 | 3.0 s | 150 ms | 0     |
| Desktop  | **100**     | 100           | 100            | 100 | 0.7 s | 0 ms   | 0     |

Mobile numbers use Lighthouse's simulated slow-4G / 4x CPU profile. Both targets are met.

### A measurement pitfall worth knowing

An earlier run scored mobile Performance **59** (TBT 2,400 ms). That run was invalid: a
`next dev` session and the `next start` under test shared the same `.next` folder, so the dev
server overwrote the production build mid-test (the server then failed with
`Cannot find module '.next/server/...'`). QA builds now go to `.next-qa` (`NEXT_DIST_DIR`), which
a dev server never touches. Always measure with `npm run qa:build` / `npm run qa:start`.

## Accessibility: axe-core

`node scripts/a11y-axe.mjs` audits home, /projects, a project page, the 404 and /login in light and
dark at 390 px and 1280 px (20 combinations) with the WCAG 2.0/2.1/2.2 A and AA rules plus
best-practice rules. Scrolling-dependent reveals are settled first.

- Before: 1 serious issue on every content page (`label-content-name-mismatch`: the logo link's
  `aria-label` did not contain its visible text) and 3 moderate issues on /login (no `<main>`, no
  `<h1>`, content outside landmarks). Raw output: `axe-before.txt`.
- Fixes: the logo link now takes its accessible name from screen-reader text instead of an
  `aria-label`; /login is a `<main>` with an `<h1>`.
- After: **0 violations in all 20 combinations** (`axe-after.txt`). Color contrast is clean in both
  modes; the token pairs are also checked by `npm run design:contrast` (every palette x mode pair).

## Keyboard walkthrough (`tests/e2e/keyboard.spec.ts`, desktop)

- The skip link is the first tab stop, is visible when focused, and moves focus to `#main-content`.
- Every one of the 36 tab stops on the home page shows a visible focus indicator and is scrolled into view; focus
  reaches the footer (no keyboard trap); Shift+Tab walks back to the skip link.
- The theme toggle works with Enter and Space; the chat launcher opens with Enter, closes with
  Escape and returns focus; all contact-form fields are reachable and labelled.
- The mobile menu opens, lists every link and closes with Escape (`smoke.spec.ts`, mobile project).

## Playwright smoke tests (`npm run qa:build && npm run test:e2e`)

34 test runs across a desktop and a mobile project: 26 passed, 0 failed, 8 skipped by design
(desktop-only / mobile-only cases). They cover: every home section renders with no console errors
and no horizontal overflow, prism palette + system color scheme, theme toggle and live
`theme-color`, scroll-progress bar, nav jump and `aria-current`, project filters, project page, themed
404, /login without the progress bar, and reduced motion (no infinite animation keeps running, the
cursor is static).

## Other checks

- Layout shift: 0.0005 on load (`scripts/verify-motion.mjs`); Lighthouse CLS 0 to 0.001.
- Reduced motion: 0 infinite animations running with `prefers-reduced-motion: reduce`; 10 decorative
  animations run without it.
- Lint, type check, unit tests (76), production build and the contrast guard (393 pairs) pass.

## Final screenshots

`docs/design/final/`: home (full length), /projects, a project page and the 404, each at 375, 768 and
1440 px in light and dark, plus the mobile menu. Regenerate with
`node scripts/screenshots.mjs final http://localhost:3100 --full`.
