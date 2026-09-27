# 🤖 Maestro7IT Chatbot — Admin Panel

[English](README_EN.md) | [Русский](README.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Chatbot for the **MAX** messenger of the **Maestro7IT** programming school — information support for students across 23 courses on the Stepik platform.

Modeled after [service-learning-max-chatbot](https://github.com/QuadDarv1ne/service-learning-max-chatbot).

---

## 📖 About the project

The bot helps visitors quickly find answers about Maestro7IT courses: which course to choose, how to enroll, how much it costs, where classes take place, and how to contact the school.

**Key requirement** — the ability for school staff to update the answer base **without involving developers**. This is implemented through a visual admin panel with full CRUD.

### How it works

```
User (MAX) → webhook → bot-logic → FAQ search → answer
                                  ↘ LLM fallback (if the question is not in the base but is on-topic)
```

1. The user writes to the bot or taps an inline button.
2. MAX sends the event to `POST /api/max/webhook`.
3. The bot searches the knowledge base (text normalization, stop-words, scoring).
4. If there is no answer but the question relates to the school, the LLM fallback kicks in.
5. Everything is logged for analytics.

---

## ✨ Features

### For the user in MAX

- 🔍 Keyword search with relevance ranking
- 📂 Category navigation via inline buttons (7 course directions)
- 📃 Pinned questions — important items always on top
- 👍 Answer rating ("Helpful" / "Not helpful")
- 🤖 LLM fallback via z-ai-web-dev-sdk
- 💬 Commands: `/start`, `/help`, `/menu`, `/faq`, `/contacts`, `/about`, `/search`, `/show`

### For the administrator

- 📊 Dashboard — key metrics for the last 24 hours
- 📈 Analytics — answer funnel, FAQ/LLM share, off-topic, charts (Recharts)
- 🗂️ Knowledge base (FAQ) — CRUD for categories and answers, tags, pinning, publishing
- ❓ Unanswered requests — one-click add straight to the base
- 📝 Request logs — all inbound/outbound with filters and CSV export
- 🔴 Real-time logs via SSE
- 🛡️ Action log — audit of administrator operations
- ⚙️ Settings — bot token, webhook, texts, bot check, health status
- 📣 Broadcasts — instant and scheduled messages to users
- 🔎 Global search (`Ctrl+K` / `⌘K`) across the whole base
- 🌓 Light/dark theme

---

## 🛠️ Tech stack

| Layer | Stack |
|------|------|
| Backend | Next.js 16 (App Router), TypeScript 5 |
| Database | Prisma ORM 6 + SQLite |
| Frontend | React 19, shadcn/ui, Tailwind CSS 4, Recharts |
| Integration | MAX Bot API — `https://platform-api2.max.ru/` |
| AI fallback | z-ai-web-dev-sdk (backend only) |
| Runtime | Bun (recommended) or Node.js 18+ |

---

## Quick start

### Requirements

- **Bun** 1.0+ (recommended) or **Node.js** 18+
- 256 MB RAM (dev) / 512 MB (prod)

### Installation

```bash
# 1. Install dependencies
bun install

# 2. Configure the environment
cp .env.example .env
# Edit .env: DATABASE_URL, ADMIN_PASSWORD

# 3. Create the DB schema and populate the knowledge base
bun run db:push
bun run scripts/seed.ts

# 4. Run
bun run dev
```

Open **http://localhost:3000** — the admin panel. Default password `admin123` (**change it in `.env`!**).

### Connecting to the MAX bot

1. Create and verify a profile on the [MAX Business Portal](https://business.max.ru/self).
2. Go to the **"Chatbots"** section → create a bot → pass moderation (up to 48 hours).
3. Copy the access token.
4. In the admin panel: **"Settings"** → paste the token → save.
5. Set the webhook URL (`https://your-domain.com/api/max/webhook`) → **"Subscribe webhook"** → **"Check bot"**.

> The webhook requires **HTTPS**. For local development use `cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000`.

---

## 📁 Project structure

```
.
├── prisma/
│   └── schema.prisma              # 13 DB models
├── scripts/
│   └── seed.ts                    # 23 courses + 12 general FAQ + commands + settings
├── src/
│   ├── app/
│   │   ├── api/                   # 27 API route handlers
│   │   │   ├── health/
│   │   │   ├── max/webhook/       # Webhook for MAX
│   │   │   ├── admin/{login,logout,me}/
│   │   │   ├── categories/        # CRUD
│   │   │   ├── faq/               # CRUD
│   │   │   ├── tags/              # CRUD
│   │   │   ├── logs/              # list + export CSV + stream SSE
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   ├── bot/{check,simulate,webhook/{subscribe,unsubscribe}}/
│   │   │   ├── broadcasts/        # CRUD + async send
│   │   │   ├── unanswered/        # list + convert to FAQ
│   │   │   ├── commands/          # CRUD
│   │   │   ├── admin-actions/
│   │   │   └── search/            # global
│   │   ├── layout.tsx             # Root layout with ThemeProvider
│   │   └── page.tsx               # SPA with auth gate
│   ├── components/
│   │   ├── admin/                 # Admin panel components
│   │   ├── ui/                    # shadcn/ui components
│   │   └── theme-provider.tsx
│   └── lib/
│       ├── db.ts                  # Prisma client
│       ├── max-api.ts             # MAX Bot API client
│       ├── bot-logic.ts           # Search + LLM fallback + callbacks
│       ├── llm.ts                 # z-ai-web-dev-sdk
│       ├── search.ts              # FAQ search engine + globalSearch
│       ├── auth.ts                # Cookie session auth
│       ├── api-helpers.ts         # requireAdmin, logAdminAction
│       └── api-client.ts          # Frontend API client
├── db/custom.db                   # SQLite (created automatically)
└── .env                           # DATABASE_URL, ADMIN_PASSWORD, MAX_BOT_TOKEN
```

### Database models

`Category`, `FaqItem`, `Tag`, `FaqTag`, `MaxUser`, `MessageLog`, `FaqFeedback`, `BotSetting`, `BotCommand`, `Broadcast`, `BroadcastRecipient`, `AdminActionLog`, `AdminSession`

---

## ⚙️ Environment variables

| Variable | Required | Default | Purpose |
|------------|:-----------:|--------------|------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | Path to the SQLite database |
| `ADMIN_PASSWORD` | Yes | `admin123` | Admin panel password |
| `MAX_BOT_TOKEN` | No | — | Bot token (the value stored in the DB takes priority) |
| `NODE_ENV` | No | `development` | `production` for production |
| `PORT` | No | `3000` | HTTP server port |

---

## 📜 Scripts

| Command | Purpose |
|---------|-----------|
| `bun run dev` | Dev server on `localhost:3000` |
| `bun run lint` | ESLint |
| `bun run db:push` | Apply the schema to the DB |
| `bun run db:generate` | Generate the Prisma Client |
| `bun run scripts/seed.ts` | Populate the knowledge base |

---

## 🚢 Deployment

- **VPS** — systemd + Caddy (recommended). A ready `Caddyfile` is included; the app builds with Next.js `output: "standalone"`, so it runs via `node .next/standalone/server.js`. HTTPS is required for the webhook.
- **Container** — the standalone build (`.next/standalone` + `.next/static` + `public`) can be packaged into any Node.js 18+/Bun image.
- ⚠️ **Vercel/Netlify are not suitable** — SQLite does not work in a serverless environment.

**Verify after deployment:**

```bash
curl https://your-domain.com/api/health
```

---

## 📞 Contacts

- **School**: [school-maestro7it.ru](https://school-maestro7it.ru)
- **Founder**: Dupley Maxim Igorevich (ORCID: 0009-0007-7605-539X)
- **Research**: [science-maestro-maestro7it.amvera.io](https://science-maestro-maestro7it.amvera.io)
- **MAX**: [school profile](https://max.ru/u/f9LHodD0cOLxcVXpSMqTSZLCFG_q6uz0QRQKOhGSBc5RIx4h-KYqVRvzW3k)
- **Telegram**: [@quadd4rv1n7](https://t.me/quadd4rv1n7)
- **WhatsApp**: +7 915 048-02-49
- **Email**: info@maestro7it.ru
- **Course platform**: [Stepik](https://stepik.org)

---

## 📝 License

© 2026 Maestro7IT · Dupley Maxim Igorevich.

Modeled after [service-learning-max-chatbot](https://github.com/QuadDarv1ne/service-learning-max-chatbot) (QuadDarv1ne).

See the [LICENSE](LICENSE) file (English) and [LICENSE_RU](LICENSE_RU) (Russian) for the full terms.
