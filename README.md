# Portfolio

Personal portfolio built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma
(PostgreSQL) and NextAuth, with an admin panel and an AI "Ask about me" chatbot.

> A full README (setup, architecture, deployment) is added in a later phase.

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
