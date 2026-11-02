# Portfolio

Personal portfolio built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma
(PostgreSQL) and NextAuth, with an admin panel and an AI "Ask about me" chatbot.

> A full README (setup, architecture, deployment) is added in a later phase.

## Design

The visual design is driven by semantic tokens, a small set of shared components and one
decorative layer, so a look can change without touching any component.

### Tokens (`app/palettes/prism.css`)

Every brand color, gradient, tint, glow and style switch is a CSS variable defined **per palette and
per mode**: `[data-palette="prism"]` (light) and `.dark[data-palette="prism"]` (dark). `<html>` carries
`data-palette="prism"`; the `dark` class comes from `next-themes`. Components use only these tokens and
never a raw brand color (verified by `grep` in review and by the contrast guard).

| Group    | Tokens                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Neutrals | `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--line`, `--line-strong`, `--fg`, `--muted`                            |
| Brand    | `--brand`, `--brand-2`, `--brand-gradient`, `--brand-gradient-deep`, `--accent-text`, `--highlight`, `--highlight-fg` |
| Buttons  | `--cta-bg`, `--cta-fg`, `--cta-chip-bg`, `--cta-chip-fg`                                                              |
| Cards    | `--tint-1-bg/fg/border` … `--tint-6-*`                                                                                |
| Status   | `--danger`, `--success`, `--warning` and their `-bg` pairs                                                            |
| Depth    | `--shadow-card`, `--shadow-glow`, `--glow-1`, `--glow-2`                                                              |
| Chrome   | `--nav-bg`, `--progress-bg`, `--focus`, `--selection-*`, and `--atm-*` for the decorative graphics                    |

`tailwind.config.ts` maps them to utilities (`bg-surface`, `text-muted`, `border-line`, `bg-brand-gradient`,
`shadow-card`, `tint-N` + `bg-t-bg`/`text-t-fg`/`border-t-border`, …). Adding a palette means adding a pair
of blocks with the same token names in a new file under `app/palettes/`; no component changes.

**Contrast band.** A section with the `band` class re-declares the neutral, tint and button tokens for its
subtree (a deep violet panel inside the light page, a lifted one in dark mode), so components inside keep
using plain tokens. The Projects section and the Skills wall use it.

### Components

- `components/ui`: `Button` (round-arrow pill, `primary` / `secondary`, `sm` / `md`), `Card` (optional tint
  and hover gradient border), `Chip`, `Section` (backdrop slot, programmatic focus target),
  `SectionHeading` (eyebrow with blinking `_`, exactly one highlighted word), `Highlight`.
- `Atmosphere`: the decorative layer (`hero` and `soft` variants, light and dark pieces switched with the
  `dark:` class, so there is no flash). Pure CSS and small inline SVG; `aria-hidden`, frozen under reduced motion.
- `Navbar` (floating pill, sliding active indicator moved with `transform`), `ThemeToggle` (System / Light /
  Dark), `ThemeColor` (keeps `<meta name="theme-color">` in step with `--bg`), `ScrollProgress`, `Reveal`.

### Theming

`next-themes` (class strategy, system by default, no flash on load) wraps the app in `components/Providers`.
Fonts come from `next/font`: Space Grotesk (headings), Inter (body) and Hind Siliguri as the Bangla fallback.
The design is AA-checked, not eyeballed: `npm run design:contrast` tests every text/background pair of every
palette, mode and band, and fails below WCAG AA.

### Motion

Only `transform` and `opacity` animate; reveals use the easing `cubic-bezier(0.22, 1, 0.36, 1)`. With
`prefers-reduced-motion` the floating shapes, the cursor blink, the scroll reveals and smooth scrolling are
switched off (checked by a test).

### Quality checks

| Command                                 | What it does                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run design:contrast`               | WCAG AA guard over all token pairs                                                     |
| `npm run qa:build` / `npm run qa:start` | production build in `.next-qa` (a running `next dev` cannot overwrite it) on port 3100 |
| `npm run test:e2e`                      | Playwright smoke + keyboard tests (desktop and mobile), run against the QA build       |
| `node scripts/a11y-axe.mjs`             | axe-core audit of the public pages in both modes (`npm i --no-save axe-core` first)    |
| `node scripts/screenshots.mjs <name>`   | screenshots at 375 / 768 / 1440, light and dark, into `docs/design/<name>`             |
| `node scripts/verify-motion.mjs`        | progress bar, theme-color, reduced motion and CLS checks                               |

Results of the latest run (Lighthouse, axe, keyboard, e2e) are in `docs/design/qa/README.md`. Always measure
performance on the QA build: a dev server sharing `.next` corrupts production measurements.

## AI chatbot admin (`/admin/ai`)

The chatbot is configured from the admin panel; environment variables are only a fallback.

| Setting                        | What it does                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enable                         | Shows or hides the chat widget on the public site.                                                                                                                              |
| Provider                       | Anthropic, OpenAI, Google (Gemini) or OpenRouter. Only these are allowed.                                                                                                       |
| Model                          | Any model id for that provider; suggestions are listed in the form.                                                                                                             |
| API key                        | Stored encrypted (AES-256-GCM). After saving, only the last 4 characters are shown. Leave the field empty to keep the stored key. Changing the provider removes the stored key. |
| Temperature / max reply tokens | Generation settings (0–1, 50–2000).                                                                                                                                             |
| Messages per minute / per day  | Per-visitor (IP) rate limits.                                                                                                                                                   |
| Extra instructions             | Added to the assistant's instructions; it still only answers from portfolio content.                                                                                            |

- **Test connection** sends a tiny prompt with the entered (or stored) key and shows a
  sanitized result. API keys are never shown, logged or returned to the browser.
- **Usage** shows today's messages, rate-limited requests, errors and token counts.

### Setup

1. Generate an encryption key and add it to the environment (locally and on Vercel):

   ```bash
   openssl rand -base64 32   # -> SETTINGS_ENCRYPTION_KEY
   ```

2. Open `/admin/ai`, choose a provider and model, paste the API key, click
   **Test connection**, then enable the chatbot and save.
3. Set a monthly spending limit in the provider's dashboard.

If `SETTINGS_ENCRYPTION_KEY` changes, the stored key can no longer be decrypted; enter it
again in `/admin/ai`.

**Env fallback:** when nothing is saved in `/admin/ai`, the chatbot uses `AI_PROVIDER`,
`AI_MODEL` and the provider's key variable (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`GOOGLE_GENERATIVE_AI_API_KEY` or `OPENROUTER_API_KEY`). See `.env.example`.

### Conversations and human handoff

Every chat is saved as a conversation so you can follow up.

- **Visitor identity:** on the first message the server creates a conversation and gives the
  browser a random 32-byte token (kept in `localStorage`). Only its SHA-256 hash is stored.
  Every later request must present the token. Message roles are always set by the server.
- **Handoff:** the assistant can call a `request_human_help` tool, and the widget has a
  "Talk to <name>" button. Either way the conversation becomes **Needs you**, you are notified
  (email via Resend, plus optional Telegram/ntfy), and the visitor can leave an email.
- **Replying:** `/admin/conversations` lists conversations (all / needs reply / unanswered /
  closed). Replying takes over from the bot (status **You're handling it**) until you click
  **Hand back to bot**. The visitor sees your reply in the widget (it polls every 8 s while
  open) and by email if they left one. _Resend can only email arbitrary visitors after you
  verify a domain; with `onboarding@resend.dev` it only delivers to your own address._
- **FAQ:** `/admin/faq` holds questions and answers that are added to the chatbot's
  knowledge. On a conversation, **Add to FAQ** prefills the visitor's question and your reply.

### Privacy and retention

- Raw IP addresses are never stored: rate limits use a salted SHA-256 hash of the IP.
- Chat conversations (and their messages) are **deleted automatically 90 days after the last
  message** by a daily Vercel Cron job (`/api/cron/cleanup`, see `vercel.json`), secured with
  `CRON_SECRET`.
- Contact-form messages are kept until you delete them in `/admin/messages`.

### Why context stuffing instead of RAG

The knowledge base (one profile plus a handful of skills, jobs, degrees and projects) is
only a few thousand tokens, so it is sent in full in the system prompt. That is simpler and
more accurate than retrieval (no embeddings, no vector database, nothing to get out of sync),
and the static prompt prefix is cached by the providers that support prompt caching.
