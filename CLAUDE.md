# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
pnpm dev              # Start dev server (Vite HMR)
pnpm build            # Production build
pnpm check            # Type-check (svelte-check --tsconfig ./tsconfig.json)
pnpm lint             # Prettier format check
pnpm format           # Prettier format write
pnpm test             # Run vitest once
pnpm test:unit        # Run vitest in watch mode
```

Build requires `BOT_TOKEN` set (the Telegram bot token key is used for HMAC signing during build-time bot setup). CI sets `BOT_TOKEN=SOME_STRING` as a dummy value.

## Architecture

This is a **SvelteKit 2 + Node adapter** app for ordering food at an office. Admins manage multiple locations (each with its own Telegram chat and menu). Users authenticate via the Telegram Login Widget and submit orders that are forwarded to the location's Telegram group chat. The UI is in Russian.

### Tech stack

- **Svelte 5** (runes: `$state`, `$derived`, `$props`, `$effect`) — no Svelte 4 stores
- **Adapter:** `@sveltejs/adapter-node` (runs as Node server, Docker `node:24-alpine`)
- **Telegram bot:** `grammy` for sending messages/buttons to the group chat
- **Date/time:** `@js-joda/core` + `@js-joda/timezone`
- **Logging:** `pino`
- **Persistence:** SQLite via Drizzle ORM (`drizzle-orm` + `@libsql/client`), file path from `DB_URL` env var
- **Tests:** vitest, server-side only (no component tests), `expect.requireAssertions: true`

### Routing (SvelteKit file-based)

| Route              | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `/order`           | Main order page. Multi-step wizard: Choose → Confirm → Done. Requires Telegram auth.              |
| `/up`              | Health check → `{ ok: true }`                                                                     |
| `/_/[secret]/edit` | Admin panel: manage locations, set per-location menus, send order buttons. Protected by `SECRET`. |
| `/_/parser`        | Utility: paste forwarded Telegram order messages → TSV output                                     |
| `/_/[secret]`      | No page — deliberately 404                                                                        |

### Auth flow

`src/lib/server/bot.ts:authenticate()` validates Telegram Login Widget parameters: filters to known Telegram params only (`id`, `first_name`, `last_name`, `username`, `photo_url`, `auth_date`, `hash`), sorts them, builds a data-check string, HMAC-SHA256 signs it using the bot token's SHA-256 hash as secret, and compares against the provided `hash`. Extra params like `locationId` are excluded so they don't break the signature. Returns the user's Telegram `id`. Both `+page.server.ts` load and `+server.ts` POST on `/order` enforce auth, returning 401 on failure.

### Data flow

1. Admin creates locations (name + Telegram chat ID) and sets a menu for each via `/_/[secret]/edit`
2. "Save and Send" calls `bot.sendOrderButton(location)` → posts a Telegram inline keyboard to that location's chat with a `login_url` pointing to `/order?locationId=...`
3. User taps the button, Telegram authenticates them, they land on `/order?locationId=...`
4. User selects items/quantities, confirms → POST to `/order/+server.ts`
5. Server: auth → idempotency check → looks up location's chatId → `bot.sendOrder()` → save name → respond

### Idempotency

The order POST uses an `Idempotency-Key` header (UUID from `crypto.randomUUID()`). Processed keys are tracked in an in-memory `Set` — resubmitting returns the existing response.

### Menu expiration

`database.getMenu(locationId)` returns `null` if the menu's `updatedAt` date is not today (menus reset daily).

### Timezone

All app time is in `Europe/Minsk` (`APP_TZ` in `src/lib/server/utils.ts`).

### Key server modules (`src/lib/server/`)

- `bot.ts` — Grammy bot instance, `sendOrder(order, userId, chatId)`, `sendOrderButton(location)`, `authenticate()` (filters data-check to known Telegram params only: `id`, `first_name`, `last_name`, `username`, `photo_url`, `auth_date`, `hash`)
- `database.ts` — Re-exports from `db/database.ts` (kept for existing import paths)
- `db/schema.ts` — Drizzle ORM schema: `locationsTable` (id, name, chatId, menu, updatedAt, receiptDate) and `namesTable` (telegramId, name)
- `db/store.ts` — Drizzle instance (libsql driver), reads db file path from `DB_URL` env var
- `db/database.ts` — `getLocations()`, `getLocation()`, `addLocation()`, `updateLocation()`, `deleteLocation()`, `getMenu(locationId)`, `setMenu(locationId, menu)`, `getName()`, `setName()`
- `db/migrate.ts` — Runs drizzle migrations on startup
- `messagesParser.ts` — Parses forwarded Telegram order messages into TSV (3 formats supported)
- `utils.ts` — `APP_TZ` constant, `orderByExample()` sort utility
- `logger.ts` — Pino logger instance

## Environment variables

| Variable    | Purpose                |
| ----------- | ---------------------- |
| `BOT_TOKEN` | Telegram Bot API token |

| `APP_URL` | Public app URL (used for login_url) |
| `SECRET` | Path segment for admin panel access |
| `DB_URL` | SQLite database url (e.g. `file:data/app.db`) |

## Code conventions

- **Prettier:** tabs, single quotes, no trailing commas, 100 print width, `prettier-plugin-svelte`
- **TypeScript:** strict mode, `moduleResolution: "bundler"`
- **`.npmrc`:** `engine-strict=true`
- No ESLint — only Prettier for code quality
