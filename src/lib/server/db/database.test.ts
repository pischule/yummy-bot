import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		DB_URL: ':memory:'
	}
}));

import { db } from './store';
import { ordersTable } from './schema';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { saveOrder } from './database';

describe('saveOrder', () => {
	beforeAll(async () => {
		if (!(globalThis as any).__migrations_ran) {
			await migrate(db, { migrationsFolder: './drizzle' });
			(globalThis as any).__migrations_ran = true;
		}
	});

	beforeEach(async () => {
		await db.delete(ordersTable);
	});

	it('persists an order with all fields', async () => {
		await saveOrder({
			locationId: 'loc-1',
			telegramId: 'user-1',
			name: 'Alice',
			orderedItems: [
				{ name: 'Burger', qty: 2 },
				{ name: 'Fries', qty: 1 }
			],
			receiptDate: '2026-05-12',
			createdAt: '2026-05-11T10:00:00.000Z'
		});

		const rows = await db.select().from(ordersTable);
		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBeGreaterThan(0);
		expect(rows[0].locationId).toBe('loc-1');
		expect(rows[0].telegramId).toBe('user-1');
		expect(rows[0].name).toBe('Alice');
		expect(rows[0].orderedItems).toEqual([
			{ name: 'Burger', qty: 2 },
			{ name: 'Fries', qty: 1 }
		]);
		expect(rows[0].receiptDate).toBe('2026-05-12');
		expect(rows[0].createdAt).toBe('2026-05-11T10:00:00.000Z');
	});

	it('assigns different ids to different orders', async () => {
		await saveOrder({
			locationId: 'loc-1',
			telegramId: 'user-1',
			name: 'Alice',
			orderedItems: [{ name: 'Burger', qty: 1 }],
			receiptDate: '2026-05-12',
			createdAt: '2026-05-11T10:00:00.000Z'
		});

		await saveOrder({
			locationId: 'loc-2',
			telegramId: 'user-2',
			name: 'Bob',
			orderedItems: [{ name: 'Salad', qty: 3 }],
			receiptDate: '2026-05-12',
			createdAt: '2026-05-11T10:01:00.000Z'
		});

		const rows = await db.select().from(ordersTable);
		expect(rows).toHaveLength(2);
		expect(rows[0].id).not.toBe(rows[1].id);
		expect(rows[0].id).toBeGreaterThan(0);
		expect(rows[1].id).toBeGreaterThan(0);
	});
});
