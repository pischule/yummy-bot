import { describe, it, expect, vi } from 'vitest';
import { ordersToTsv } from './messagesParser';
import * as database from './database';

vi.mock('./database', () => ({
	getLocations: vi.fn()
}));

describe('ordersToTsv guessing menu', () => {
	it('should order columns by matched menu', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([
			{
				id: 'loc1',
				name: 'Location 1',
				chatId: '123',
				menu: ['Soup', 'Salad', 'Burger', 'Dessert'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			}
		]);

		const text = `
    > YummyOrderBot:
    Alice:
    - Burger
    - Salad
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// Matches menu of loc1, so should follow its order: Salad then Burger
		expect(headers).toBe('Имя\t"Salad"\t"Burger"');
	});

	it('should pick the location with the highest match score', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([
			{
				id: 'loc-pizza',
				name: 'Pizza Place',
				chatId: '1',
				menu: ['Pizza', 'Soda', 'Salad'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			},
			{
				id: 'loc-burger',
				name: 'Burger Joint',
				chatId: '2',
				menu: ['Burger', 'Fries', 'Soda'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			}
		]);

		const text = `
    > YummyOrderBot:
    Alice:
    - Burger
    - Fries
    - Soda
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// Burger Joint matches 3 items, Pizza Place matches 1 (Soda).
		// Should follow Burger Joint menu: Burger, Fries, Soda
		expect(headers).toBe('Имя\t"Burger"\t"Fries"\t"Soda"');
	});

	it('should put unknown items at the end when a menu is matched', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([
			{
				id: 'loc1',
				name: 'Location 1',
				chatId: '123',
				menu: ['A', 'B', 'C'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			}
		]);

		const text = `
    > YummyOrderBot:
    Alice:
    - C
    - Unknown
    - A
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// A and C are in menu [A, B, C], so A comes before C.
		// Unknown is not in menu, should be at the end.
		expect(headers).toBe('Имя\t"A"\t"C"\t"Unknown"');
	});

	it('should fallback to relative ordering if no menu matches', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([
			{
				id: 'loc1',
				name: 'Location 1',
				chatId: '123',
				menu: ['X', 'Y', 'Z'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			}
		]);

		const text = `
    > YummyOrderBot:
    Alice:
    - Burger
    - Fries
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// No matches with [X, Y, Z].
		// Fallback to relative ordering: Burger before Fries because it appeared first.
		expect(headers).toBe('Имя\t"Burger"\t"Fries"');
	});

	it('should pick the first winner if there is a tie in scores', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([
			{
				id: 'loc-a',
				name: 'A',
				chatId: '1',
				menu: ['Common', 'A-only'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			},
			{
				id: 'loc-b',
				name: 'B',
				chatId: '2',
				menu: ['Common', 'B-only'],
				updatedAt: '',
				receiptDate: '',
				postedAt: null
			}
		]);

		const text = `
    > YummyOrderBot:
    Alice:
    - Common
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// Both match 1 item. Should pick the first one (loc-a).
		expect(headers).toBe('Имя\t"Common"');
	});

	it('should handle empty locations list', async () => {
		vi.mocked(database.getLocations).mockResolvedValue([]);

		const text = `
    > YummyOrderBot:
    Alice:
    - Burger
    - Fries
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		expect(headers).toBe('Имя\t"Burger"\t"Fries"');
	});
});
