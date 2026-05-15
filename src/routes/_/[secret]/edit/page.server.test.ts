import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		SECRET: 'test-secret',
		BOT_USERNAME: 'test_bot',
		BOT_TOKEN: 'test-bot-token',
		APP_URL: 'https://test.example.com',
		DB_URL: ':memory:'
	}
}));

vi.mock('$lib/server/bot', () => ({
	sendOrder: vi.fn().mockResolvedValue(undefined),
	sendOrderButton: vi.fn().mockResolvedValue(undefined)
}));

import { db } from '$lib/server/db/store';
import { locationsTable, namesTable } from '$lib/server/db/schema';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { actions } from './+page.server';
import * as bot from '$lib/server/bot';

const SECRET = 'test-secret';

function mockRequest(data: Record<string, string>): Request {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.append(key, value);
	}
	return new Request('http://localhost/_/test-secret/edit', { method: 'POST', body: fd });
}

function mockParams(secret = SECRET) {
	return { secret };
}

function mockUrl(pathname = '/_/test-secret/edit', search: Record<string, string> = {}) {
	const url = new URL('http://localhost' + pathname);
	for (const [key, value] of Object.entries(search)) {
		url.searchParams.set(key, value);
	}
	return url;
}

describe('Admin form actions', () => {
	beforeAll(async () => {
		if (!(globalThis as any).__migrations_ran) {
			await migrate(db, { migrationsFolder: './drizzle' });
			(globalThis as any).__migrations_ran = true;
		}
	});

	beforeEach(async () => {
		await db.delete(locationsTable);
		await db.delete(namesTable);
		vi.clearAllMocks();
		vi.mocked(bot.sendOrderButton).mockResolvedValue(undefined);
		vi.mocked(bot.sendOrder).mockResolvedValue(undefined);
	});

	describe('addLocation', () => {
		it('creates a location and redirects', async () => {
			const request = mockRequest({ name: 'Test Location', chatId: '123456' });

			try {
				await actions.addLocation({ request, params: mockParams(), url: mockUrl() } as any);
				expect.unreachable('expected redirect');
			} catch (e: any) {
				expect(e.status).toBe(303);
				expect(e.location).toContain('locationId=');
			}

			const locations = await db.select().from(locationsTable);
			expect(locations).toHaveLength(1);
			expect(locations[0].name).toBe('Test Location');
			expect(locations[0].chatId).toBe('123456');
			expect(locations[0].menu).toEqual([]);
		});

		it('returns error when name is empty', async () => {
			const result = await actions.addLocation({
				request: mockRequest({ name: '', chatId: '123456' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Заполните все поля' });
		});

		it('returns error when chatId is empty', async () => {
			const result = await actions.addLocation({
				request: mockRequest({ name: 'Test', chatId: '' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Заполните все поля' });
		});

		it('returns error when chatId is not a number', async () => {
			const result = await actions.addLocation({
				request: mockRequest({ name: 'Test', chatId: 'abc' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Chat ID должен быть числом' });
		});

		it('returns error when chatId already exists', async () => {
			await db.insert(locationsTable).values({
				id: 'existing-id',
				name: 'Existing',
				chatId: '123456',
				menu: [],
				updatedAt: '',
				receiptDate: ''
			});

			const result = await actions.addLocation({
				request: mockRequest({ name: 'Test', chatId: '123456' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Локация с таким Chat ID уже существует' });
		});

		it('returns 404 when secret does not match', async () => {
			try {
				await actions.addLocation({
					request: mockRequest({ name: 'Test', chatId: '123456' }),
					params: mockParams('wrong'),
					url: mockUrl()
				} as any);
				expect.unreachable('expected error');
			} catch (e: any) {
				expect(e.status).toBe(404);
			}
		});
	});

	describe('save', () => {
		async function seedLocation(chatId = '123456') {
			const id = crypto.randomUUID();
			await db.insert(locationsTable).values({
				id,
				name: 'Test',
				chatId,
				menu: [],
				updatedAt: '',
				receiptDate: ''
			});
			return id;
		}

		it('saves menu items and redirects', async () => {
			const locationId = await seedLocation();
			const request = mockRequest({
				locationId,
				receiptDate: '2026-05-12',
				items: 'Item 1\nItem 2\nItem 3'
			});

			try {
				await actions.save({ request, params: mockParams(), url: mockUrl() } as any);
				expect.unreachable('expected redirect');
			} catch (e: any) {
				expect(e.status).toBe(303);
				expect(e.location).toContain('locationId=' + locationId);
			}

			const rows = await db.select().from(locationsTable);
			expect(rows[0].menu).toEqual(['Item 1', 'Item 2', 'Item 3']);
			expect(rows[0].receiptDate).toBe('2026-05-12');
			expect(rows[0].updatedAt).toBeTruthy();
		});

		it('deduplicates items', async () => {
			const locationId = await seedLocation();
			const request = mockRequest({
				locationId,
				receiptDate: '2026-05-12',
				items: 'Item 1\nItem 1\nItem 2'
			});

			try {
				await actions.save({ request, params: mockParams(), url: mockUrl() } as any);
				expect.unreachable('expected redirect');
			} catch {
				// expected redirect
			}

			const rows = await db.select().from(locationsTable);
			expect(rows[0].menu).toEqual(['Item 1', 'Item 2']);
		});

		it('filters empty lines from items', async () => {
			const locationId = await seedLocation();
			const request = mockRequest({
				locationId,
				receiptDate: '2026-05-12',
				items: 'Item 1\n\nItem 2\n  \nItem 3'
			});

			try {
				await actions.save({ request, params: mockParams(), url: mockUrl() } as any);
				expect.unreachable('expected redirect');
			} catch {
				// expected redirect
			}

			const rows = await db.select().from(locationsTable);
			expect(rows[0].menu).toEqual(['Item 1', 'Item 2', 'Item 3']);
		});

		it('returns error when locationId is missing', async () => {
			const result = await actions.save({
				request: mockRequest({ locationId: '', receiptDate: '2026-05-12', items: 'Item' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Локация не выбрана' });
		});
	});

	describe('saveAndSend', () => {
		async function seedLocation(chatId = '123456') {
			const id = crypto.randomUUID();
			await db.insert(locationsTable).values({
				id,
				name: 'Test',
				chatId,
				menu: [],
				updatedAt: '',
				receiptDate: ''
			});
			return id;
		}

		it('saves menu and sends order button, then redirects', async () => {
			const locationId = await seedLocation();
			const request = mockRequest({
				locationId,
				receiptDate: '2026-05-12',
				items: 'Item 1\nItem 2'
			});

			try {
				await actions.saveAndSend({ request, params: mockParams(), url: mockUrl() } as any);
				expect.unreachable('expected redirect');
			} catch (e: any) {
				expect(e.status).toBe(303);
			}

			expect(bot.sendOrderButton).toHaveBeenCalledOnce();
			expect(bot.sendOrderButton).toHaveBeenCalledWith(
				expect.objectContaining({ chatId: '123456' })
			);

			const rows = await db.select().from(locationsTable);
			expect(rows[0].menu).toEqual(['Item 1', 'Item 2']);
		});

		it('returns error when locationId is missing', async () => {
			const result = await actions.saveAndSend({
				request: mockRequest({ locationId: '', receiptDate: '2026-05-12', items: 'Item' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Локация не выбрана' });
			expect(bot.sendOrderButton).not.toHaveBeenCalled();
		});

		it('returns error when location not found', async () => {
			const result = await actions.saveAndSend({
				request: mockRequest({
					locationId: 'non-existent',
					receiptDate: '2026-05-12',
					items: 'Item'
				}),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({ success: false, error: 'Локация не найдена' });
			expect(bot.sendOrderButton).not.toHaveBeenCalled();
		});

		it('handles bot 400 error — menu still saved', async () => {
			const locationId = await seedLocation();
			vi.mocked(bot.sendOrderButton).mockRejectedValueOnce({ error_code: 400 });

			const result = await actions.saveAndSend({
				request: mockRequest({ locationId, receiptDate: '2026-05-12', items: 'Item 1' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({
				success: false,
				error: 'Чат не найден. Проверьте Chat ID локации'
			});

			const rows = await db.select().from(locationsTable);
			expect(rows[0].menu).toEqual(['Item 1']);
		});

		it('handles non-400 bot errors gracefully', async () => {
			const locationId = await seedLocation();
			vi.mocked(bot.sendOrderButton).mockRejectedValueOnce(new Error('Network error'));

			const result = await actions.saveAndSend({
				request: mockRequest({ locationId, receiptDate: '2026-05-12', items: 'Item 1' }),
				params: mockParams(),
				url: mockUrl()
			} as any);
			expect(result).toEqual({
				success: false,
				error: 'Ошибка отправки в Telegram. Проверьте Chat ID'
			});
		});
	});
});
