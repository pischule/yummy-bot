# AGENTS.md

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server (Vite HMR) |
| `BOT_TOKEN=SOME_STRING pnpm build` | Production build (needs dummy token) |
| `pnpm check` | Type-check via svelte-check |
| `pnpm lint` / `pnpm format` | Prettier check/write (no ESLint) |
| `pnpm test` | vitest once (requires assertions) |
| `pnpm test:unit` | vitest watch |
| `pnpm drizzle:generate` | Generate SQLite migration |
| `pnpm drizzle:migrate` | Run pending migrations |

## Gotchas

- **Package manager:** `pnpm`, never `npm`
- **Bash + `[secret]` in paths:** route paths contain `[` `]` — always quote paths in shell (fish/zsh treat unquoted brackets as globs)
- **Build requires `BOT_TOKEN`:** set any dummy value like `SOME_STRING` for local building (HMAC key, not a real token)
- **Env vars** (from `.env` / README): `BOT_TOKEN`, `APP_URL`, `BOT_USERNAME`, `SECRET`, `DB_URL` (SQLite, e.g. `file:data/app.db`)
- **App timezone:** `Europe/Minsk` (see `src/lib/server/utils.ts`)
- **Docker:** `node:24-alpine`, port `3000` (the README docker-compose maps 8000→3000)
- **Tests:** server-side only (no component tests), vitest with `expect.requireAssertions: true` — every test must make an assertion
- **Idempotency:** order POST requires `Idempotency-Key` header (UUID); duplicate keys are rejected by an in-memory Set
- **Menu expiration:** `getMenu(locationId)` returns `null` if `updatedAt` is not today (menus reset daily)

## Architecture

- SvelteKit 2 + **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`) — no Svelte 4 stores
- Adapter: `@sveltejs/adapter-node`
- SQLite via Drizzle ORM + libsql; migrations auto-run on startup via `hooks.server.ts`
- Telegram bot via grammy; `src/lib/server/bot.ts` handles auth (Telegram Login Widget, HMAC-SHA256 with bot token's SHA-256 as secret), sends orders to group chats, and posts order buttons with `login_url`
- Admin panel: `/_/[secret]/edit` — manage locations, set menus, send order buttons to Telegram chats
- Order flow: button in chat → Telegram auth → `/order?locationId=` → select items → POST with `Idempotency-Key` → forwarded to location's Telegram chat

## Key files

- `src/lib/server/db/schema.ts` — Drizzle schema (locationsTable, namesTable)
- `src/lib/server/db/database.ts` — DB access layer
- `src/lib/server/bot.ts` — Auth, sendOrder, sendOrderButton, init/stop
- `src/lib/server/messagesParser.ts` — Parse forwarded Telegram orders → TSV
- `src/hooks.server.ts` — Entrypoint: runs migrations, inits bot (stop on SIGTERM)
