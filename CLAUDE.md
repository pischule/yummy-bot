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

This is a **SvelteKit 2 + Node adapter** app for ordering food at an office. Users authenticate via the Telegram Login Widget and submit orders that are forwarded to a Telegram group chat. The UI is in Russian.

### Tech stack

- **Svelte 5** (runes: `$state`, `$derived`, `$props`, `$effect`) — no Svelte 4 stores
- **Adapter:** `@sveltejs/adapter-node` (runs as Node server, Docker `node:24-alpine`)
- **Telegram bot:** `grammy` for sending messages/buttons to the group chat
- **Date/time:** `@js-joda/core` + `@js-joda/timezone`
- **Logging:** `pino`
- **Persistence:** JSON files in `data/` (mounted as Docker volume)
- **Tests:** vitest, server-side only (no component tests), `expect.requireAssertions: true`

### Routing (SvelteKit file-based)

| Route | Purpose |
|-------|---------|
| `/order` | Main order page. Multi-step wizard: Choose → Confirm → Done. Requires Telegram auth. |
| `/up` | Health check → `{ ok: true }` |
| `/_/[secret]/edit` | Admin menu editor. Protected by `SECRET` env var in the URL path. |
| `/_/parser` | Utility: paste forwarded Telegram order messages → TSV output |
| `/_/[secret]` | No page — deliberately 404 |

### Auth flow

`src/lib/server/bot.ts:authenticate()` validates Telegram Login Widget parameters: sorts all query params except `hash`, builds a data-check string, HMAC-SHA256 signs it using the bot token's SHA-256 hash as secret, and compares against the provided `hash`. Returns the user's Telegram `id`. Both `+page.server.ts` load and `+server.ts` POST on `/order` enforce auth, returning 401 on failure.

### Data flow

1. Admin sets the menu via `/_/[secret]/edit` form actions → saves to `data/menu.json`
2. "Save and Send" calls `bot.sendOrderButton()` → posts a Telegram inline keyboard with a `login_url` pointing to `/order`
3. User taps the button, Telegram authenticates them, they land on `/order`
4. User selects items/quantities, confirms → POST to `/order/+server.ts`
5. Server: auth → idempotency check → `bot.sendOrder()` → save name → respond

### Idempotency

The order POST uses an `Idempotency-Key` header (UUID from `crypto.randomUUID()`). Processed keys are tracked in an in-memory `Set` — resubmitting returns the existing response.

### Menu expiration

`database.getMenu()` returns `null` if the menu's `updatedAt` date is not today (menus reset daily).

### Timezone

All app time is in `Europe/Minsk` (`APP_TZ` in `src/lib/server/utils.ts`).

### Key server modules (`src/lib/server/`)

- `bot.ts` — Grammy bot instance, `sendOrder()`, `sendOrderButton()`, `authenticate()`
- `database.ts` — CRUD for `data/menu.json` and `data/names.json`
- `jsonStore.ts` — Generic `read()`/`write()` JSON file helper
- `messagesParser.ts` — Parses forwarded Telegram order messages into TSV (3 formats supported)
- `utils.ts` — `APP_TZ` constant, `orderByExample()` sort utility
- `logger.ts` — Pino logger instance

## Environment variables

| Variable | Purpose |
|----------|---------|
| `BOT_TOKEN` | Telegram Bot API token |
| `GROUP_CHAT_ID` | Chat ID where orders are sent |
| `APP_URL` | Public app URL (used for login_url) |
| `SECRET` | Path segment for admin panel access |

## Code conventions

- **Prettier:** tabs, single quotes, no trailing commas, 100 print width, `prettier-plugin-svelte`
- **TypeScript:** strict mode, `moduleResolution: "bundler"`
- **`.npmrc`:** `engine-strict=true`
- No ESLint — only Prettier for code quality
