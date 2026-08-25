import { createHash, createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { env } from '$env/dynamic/private';
import { validateWebAppInitData } from './auth';

// In vitest, $env/dynamic/private is a snapshot of loadEnv (files override process.env),
// so auth.ts sees the same value as env.BOT_TOKEN here — sign with that, not a hardcoded mock.
const TOKEN = env.BOT_TOKEN ?? 'test-bot-token';

function buildInitData(overrides: Record<string, string> = {}): URLSearchParams {
	const params = new URLSearchParams({
		auth_date: String(Math.floor(Date.now() / 1000)),
		query_id: 'test-query-id',
		user: JSON.stringify({ id: 42, first_name: 'Test', is_bot: false })
	});
	for (const [key, value] of Object.entries(overrides)) {
		params.set(key, value);
	}
	return params;
}

function dataCheckString(params: URLSearchParams): string {
	return [...params.keys()]
		.filter((key) => key !== 'hash')
		.sort()
		.map((key) => `${key}=${params.get(key)}`)
		.join('\n');
}

// Independent implementation via node:crypto: secret = HMAC("WebAppData" as key, BOT_TOKEN)
function signInitData(params: URLSearchParams): string {
	const secret = createHmac('sha256', 'WebAppData').update(TOKEN).digest();
	return createHmac('sha256', secret).update(dataCheckString(params)).digest('hex');
}

describe('validateWebAppInitData', () => {
	it('accepts valid initData', async () => {
		const params = buildInitData();
		params.set('hash', signInitData(params));

		const session = await validateWebAppInitData(params.toString(), ['admin']);

		expect(session?.tgId).toBe(42);
		expect(session?.roles).toEqual(['admin']);
		expect(session?.validUntil).toBeGreaterThan(Date.now());
	});

	it('accepts explicit user roles', async () => {
		const params = buildInitData();
		params.set('hash', signInitData(params));

		const session = await validateWebAppInitData(params.toString(), ['user']);

		expect(session?.tgId).toBe(42);
		expect(session?.roles).toEqual(['user']);
	});

	it('rejects data with tampered user id', async () => {
		const params = buildInitData();
		const hash = signInitData(params);
		params.set('user', JSON.stringify({ id: 999, first_name: 'Evil' }));
		params.set('hash', hash);

		expect(await validateWebAppInitData(params.toString(), ['admin'])).toBeNull();
	});

	it('rejects initData without a hash', async () => {
		expect(await validateWebAppInitData(buildInitData().toString(), ['admin'])).toBeNull();
	});

	it('rejects stale auth_date', async () => {
		const stale = buildInitData({
			auth_date: String(Math.floor(Date.now() / 1000) - 120)
		});
		stale.set('hash', signInitData(stale));

		expect(await validateWebAppInitData(stale.toString(), ['admin'])).toBeNull();
	});

	it('rejects an invalid user payload', async () => {
		const params = buildInitData({ user: 'not-json' });
		params.set('hash', signInitData(params));

		expect(await validateWebAppInitData(params.toString(), ['admin'])).toBeNull();
	});

	it('rejects data signed with the login-widget secret', async () => {
		const params = buildInitData();
		const widgetSecret = createHash('sha256').update(TOKEN).digest();
		const hash = createHmac('sha256', widgetSecret).update(dataCheckString(params)).digest('hex');
		params.set('hash', hash);

		expect(await validateWebAppInitData(params.toString(), ['admin'])).toBeNull();
	});
});
