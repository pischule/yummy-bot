# AGENTS.md

## Commands

| Command                            | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| `pnpm dev`                         | Dev server (Vite HMR)                |
| `BOT_TOKEN=SOME_STRING pnpm build` | Production build (needs dummy token) |
| `pnpm check`                       | Type-check via svelte-check          |
| `pnpm lint` / `pnpm format`        | Prettier check/write (no ESLint)     |
| `pnpm test`                        | vitest once (requires assertions)    |
| `pnpm test:unit`                   | vitest watch                         |
| `pnpm drizzle:generate`            | Generate SQLite migration            |
| `pnpm drizzle:migrate`             | Run pending migrations               |

## Gotchas

- **Package manager:** `pnpm`, never `npm`
- **Engine pinning:** `.npmrc` sets `engine-strict=true` and CI locks Node.js 24 + pnpm 10
- **Bash + `[linkId]` in paths:** route paths contain `[` `]` (e.g. `/order/[linkId]`) — always quote paths in shell (fish/zsh treat unquoted brackets as globs)
- **Build requires `BOT_TOKEN`:** set any dummy value like `SOME_STRING` for local building; the bot is a grammy instance and the token becomes the HMAC key for Telegram Login Widget auth
- **Env vars** (from `.env`, README, or `.mise.toml` in dev): `BOT_TOKEN`, `APP_URL`, `ADMIN_CHAT_IDS` (comma-separated integers), `COOKIE_ENCRYPTION_KEY`, `DB_URL` (SQLite, e.g. `file:data/db.sqlite3`). `.env` and `.mise.toml` are gitignored.
- **App timezone:** `Europe/Minsk` (see `src/lib/server/utils.ts`)
- **Docker:** `node:24-alpine`, port `3000` (the README docker-compose maps 8000→3000)
- **Tests:** server-side only (no component/svelte tests). Vitest config uses `projects` with a `server` project filtered by `include: ['src/**/*.{test,spec}.{js,ts}']` and `exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']`. Setup in `src/vitest-setup.ts` mocks env vars and sets `DB_URL=:memory:`. Drizzle migrations run in `database.test.ts` via `drizzle-orm/libsql/migrator` (once per suite via global flag).
- **vitest config:** `expect.requireAssertions: true` — every test must make an assertion
- **Idempotency:** order POST requires `Idempotency-Key` header (UUID); duplicate keys are rejected by an in-memory `Set` in `src/routes/order/[locationId]/+server.ts`
- **Menu expiration:** `getMenu()` returns `null` if `updatedAt` is not today (menus reset daily)

## Architecture

- SvelteKit 2 + **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`) — no Svelte 4 stores
- Adapter: `@sveltejs/adapter-node`
- SQLite via Drizzle ORM + libsql (`drizzle-orm/libsql`); migrations auto-run on startup via `hooks.server.ts`
- Telegram bot via grammy; `src/lib/server/bot.ts` — TG Login Widget auth via HMAC-SHA256 (bot token SHA-256 as secret)
- Admin panel: `/_/edit` — manage locations, set menus, send order buttons to Telegram chats (access via `/admin` bot command + Telegram Login Widget)
- Order flow: button in chat → Telegram auth → `/order/[locationId]` → select items → POST with `Idempotency-Key` → forwarded to location's Telegram chat, persisted to SQLite

## Key files

- `src/lib/server/db/schema.ts` — Drizzle schema (`locationsTable`, `namesTable`, `ordersTable`)
- `src/lib/server/db/store.ts` — Drizzle client instance (`drizzle(env.DB_URL!)`)
- `src/lib/server/db/migrate.ts` — `runMigrations()` called from `hooks.server.ts`
- `src/lib/server/database.ts` — DB access layer (CRUD locations, menus, orders)
- `src/lib/server/auth.ts` — `authenticateAdmin`, `authenticateUser` (Telegram Login Widget + session cookies)
- `src/lib/server/bot.ts` — `init`, `stop`, `sendOrder`, `sendOrderButton`
- `src/lib/server/parser.ts` — Parse forwarded Telegram order messages → TSV
- `src/lib/ordersTsv.ts` — TSV generation with precedence-based column ordering
- `src/lib/server/logger.ts` — Pino logger instance (`import { logger } from '$lib/server/logger'`)
- `src/hooks.server.ts` — Entrypoint: runs migrations, inits bot, handles SIGTERM
