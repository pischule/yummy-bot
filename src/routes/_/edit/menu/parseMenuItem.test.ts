import { describe, it, expect } from 'vitest';
import { parseMenuItem, menuItemToString } from '$lib/server/menuItemParser';

describe('parseMenuItem', () => {
	it('returns item with no price when line has no number', () => {
		expect(parseMenuItem('Latte')).toEqual({ name: 'Latte', price: 0 });
	});

	it('parses whole number price', () => {
		expect(parseMenuItem('Latte 5')).toEqual({ name: 'Latte', price: 5 });
	});

	it('parses price with dot as decimal delimiter', () => {
		expect(parseMenuItem('Latte 5.50')).toEqual({ name: 'Latte', price: 5.5 });
	});

	it('parses price with comma as decimal delimiter', () => {
		expect(parseMenuItem('Latte 5,5')).toEqual({ name: 'Latte', price: 5.5 });
	});

	it('parses price with comma, two digits, and BYN suffix', () => {
		expect(parseMenuItem('Latte 5,50 BYN')).toEqual({ name: 'Latte', price: 5.5 });
	});

	it('parses price with dot and BYN suffix', () => {
		expect(parseMenuItem('Latte 5.5 BYN')).toEqual({ name: 'Latte', price: 5.5 });
	});

	it('parses price with BYN suffix without space', () => {
		expect(parseMenuItem('Latte 5,50BYN')).toEqual({ name: 'Latte', price: 5.5 });
	});

	it('treats number followed by non-BYN text as part of name', () => {
		expect(parseMenuItem('Coca Cola 2L')).toEqual({ name: 'Coca Cola 2L', price: 0 });
	});

	it('parses multi-word name with price', () => {
		expect(parseMenuItem('Burger meal 12.99 BYN')).toEqual({ name: 'Burger meal', price: 12.99 });
	});

	it('returns price 0 when no price is present', () => {
		expect(parseMenuItem('Espresso')).toEqual({ name: 'Espresso', price: 0 });
	});

	it('parses price with multiple BYN separators, only the last number is price', () => {
		expect(parseMenuItem('Combo 3 7,50 BYN')).toEqual({ name: 'Combo 3', price: 7.5 });
	});

	it('handles price at end with trailing whitespace-like conditions', () => {
		expect(parseMenuItem('Tea 2')).toEqual({ name: 'Tea', price: 2 });
	});

	it('does not parse number at the start as price', () => {
		expect(parseMenuItem('2 Coffee')).toEqual({ name: '2 Coffee', price: 0 });
	});
});

describe('menuItemToString', () => {
	it('returns just the name when price is 0', () => {
		expect(menuItemToString({ name: 'Latte', price: 0 })).toBe('Latte');
	});

	it('returns name and price with BYN suffix when price > 0', () => {
		expect(menuItemToString({ name: 'Latte', price: 5.5 })).toBe('Latte 5.5 BYN');
	});
});

describe('round-trip', () => {
	it('parsed then stringified equals original', () => {
		const inputs = [
			{ input: 'Latte 5,50 BYN', expected: 'Latte 5.5 BYN' },
			{ input: 'Burger meal 12.99', expected: 'Burger meal 12.99 BYN' },
			{ input: 'Espresso', expected: 'Espresso' },
			{ input: 'Combo 3 7,50 BYN', expected: 'Combo 3 7.5 BYN' }
		];
		for (const { input, expected } of inputs) {
			expect(menuItemToString(parseMenuItem(input))).toBe(expected);
		}
	});
});
