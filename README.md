# Striive

**A personal AI investment companion for private investors in Scandinavia, Finland and the UK.**

> **Note on this repository**
> This public repo is an **early, trimmed snapshot** of Striive. The project has since grown
> substantially and now lives in a private repository. The snapshot here shows the foundations —
> the Nuxt + TypeScript app, Firebase setup, Drizzle schema and Stripe integration — but not the
> full current system. The section [What the project looks like today](#what-the-project-looks-like-today)
> below describes where it has grown to, for context.

---

## What's in this snapshot

A fullstack Nuxt application with the core building blocks of the product:

- **Nuxt 3 + TypeScript** across frontend and server
- **Firebase** (App Hosting, storage rules) for hosting
- **Drizzle ORM** for typed schema and migrations
- **Stripe** for subscriptions, wired up with staging and production configs
- Structured `app/`, `server/`, `services/`, `stores/` and `shared/` layers

The intent even at this early stage was a clean separation between UI, services and data — the
frontend talks to a service layer rather than reaching into data sources directly, and API
contracts are strictly typed.

## Tech stack (snapshot)

| Area        | Choice                                    |
| ----------- | ----------------------------------------- |
| Framework   | Nuxt 3, TypeScript everywhere             |
| State       | Pinia                                     |
| Styling     | Tailwind CSS                              |
| Database    | Supabase + Drizzle ORM                   |
| Payments    | Stripe (test + live configs)              |
| Hosting     | Firebase App Hosting (staging + prod)     |

---

## What the project looks like today

The private version has grown well beyond this snapshot. For context, it is now:

- A **pnpm monorepo** with three apps — the main authenticated PWA, an internal advisor/admin
  panel, and a public marketing site — plus shared packages for the database, server layer,
  email templates, UI primitives and shared types.
- Backed by **Supabase PostgreSQL** with a **~75-table schema** covering price history,
  fundamentals, financial statements, analyst ratings, insider trades, earnings, dividends,
  news, macro indicators and more.
- Driven by **Google Cloud Tasks + Cloud Scheduler** (23 scheduled jobs) for background market-data
  sync, all fully idempotent and environment-scoped.
- Integrated with a range of external services — **Saxo** (brokerage sync), **EODHD** (market
  data), **Stripe** (billing), **Resend** (transactional email), **ElevenLabs** (multi-speaker
  podcast TTS) and **Upstash Redis** (rate limiting / caching).
- Running across **three fully isolated environments** (local / staging / production) with
  separate databases, a migration-based schema workflow (Drizzle generate + migrate), protected
  branches, and guardrails that prevent local dev from ever touching staging or prod data.
- Powered by a **unified AI provider abstraction** (Gemini / Anthropic / OpenAI) for the chat,
  finder and daily "Mission Control" brief features.

Current stack: Nuxt 3 · TypeScript · Supabase (Postgres) · Drizzle ORM · Pinia · Tailwind CSS v4
· shadcn-vue · Zod · Firebase App Hosting · Google Cloud Tasks & Scheduler · Upstash Redis ·
Stripe · Resend · ElevenLabs.
