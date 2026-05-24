import { describe, it, expect } from 'vitest';
import { ordersToTsv } from './parser';

import { orderByExample } from './parser';

describe('ordersToTsv', () => {
	it('should parse old win format', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - Burger x2
    - Fries

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - Soda x3
    - Burger
    `;

		const result = await ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines).toStrictEqual([
			'Имя\t"Soda"\t"Burger"\t"Fries"',
			'"Alice"\t\t2\t1',
			'"Bob"\t3\t1\t'
		]);
	});

	it('should parse old win format with extra colon', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]:
    Alice:
    - Burger x2
    - Fries

    YummyOrderBot, [01.01.24 12:05]:
    Bob:
    - Soda x3
    - Burger
    `;

		const result = await ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines).toStrictEqual([
			'Имя\t"Soda"\t"Burger"\t"Fries"',
			'"Alice"\t\t2\t1',
			'"Bob"\t3\t1\t'
		]);
	});

	it('should parse mac format', async () => {
		const text = `
    > YummyOrderBot:
    Alice:
    - Burger x2
    - Fries

    > OtherSender:
    Todd:
    - qwe

    > YummyOrderBot:
    Bob:
    - Soda x3
    - Burger
    `;

		const result = await ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines[1]).toBe('"Alice"\t\t2\t1');
		expect(lines[2]).toBe('"Bob"\t3\t1\t');
	});

	it('should parse new win format', async () => {
		const text = `
    [01.01.24 12:00] YummyOrderBot: Alice:
    - Burger x2
    - Fries
    [01.01.24 12:00] SomeSender: QWE:
    - Similar looking format
    someJunkText
    [01.01.24 12:05] YummyOrderBot: Bob:
    - Soda x3
    - Burger
    `;

		const result = await ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines[1]).toBe('"Alice"\t\t2\t1');
		expect(lines[2]).toBe('"Bob"\t3\t1\t');
	});

	it('should sort columns based on precedence derived from order.ts items', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - Burger
    - Fries

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - Soda
    - Burger
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		expect(headers).toBe('Имя\t"Soda"\t"Burger"\t"Fries"');
	});

	it('should sort items with equal scores alphabetically', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - Burger
    - Fries

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - Soda
    - Pizza
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// Burger beats Fries (score 1), Soda beats Pizza (score 1)
		// Fries loses to Burger (-1), Pizza loses to Soda (-1)
		// Burger/Soda tied (1), Fries/Pizza tied (-1), alphabetical within ties
		expect(headers).toBe('Имя\t"Burger"\t"Soda"\t"Fries"\t"Pizza"');
	});

	it('should derive column order.ts from multiple orders with overlapping items', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - A
    - B

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - B
    - C

    YummyOrderBot, [01.01.24 12:10]
    Charlie:
    - C
    - D
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// A before B (Alice), B before C (Bob), C before D (Charlie) → chain: A, B, C, D
		expect(headers).toBe('Имя\t"A"\t"B"\t"C"\t"D"');
	});

	it('should break ties alphabetically when no precedence information', async () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - Soda

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - Burger
    `;

		const result = await ordersToTsv(text);
		const headers = result.split('\n')[0];

		// No pairs to compare, all tied → alphabetical
		expect(headers).toBe('Имя\t"Burger"\t"Soda"');
	});

	it('should escape double quotes in item names and user names', async () => {
		const rawWithQuotes = `
    YummyOrderBot, [01.01.24 12:00]
    "Big" Ben:
    - Special "Sauce"
    `;

		const result = await ordersToTsv(rawWithQuotes);

		expect(result).toContain('"Big"" Ben"');
		expect(result).toContain('"Special ""Sauce"""');
	});

	it('should return only headers if the input text is empty', async () => {
		const result = await ordersToTsv('');
		expect(result).toBe('Имя');
	});
});

describe('orderByExample', () => {
	it('orders elements according to the example list', () => {
		const array = ['apple', 'banana', 'cherry', 'date', 'fig', 'grape'];
		const example = ['banana', 'date', 'fig'];
		const result = orderByExample(array, example);
		expect(result).toEqual(['banana', 'date', 'fig', 'apple', 'cherry', 'grape']);
	});

	it('places elements not in the example list at the end in their original order.ts', () => {
		const array = ['apple', 'banana', 'cherry'];
		const example = ['banana'];
		const result = orderByExample(array, example);
		expect(result).toEqual(['banana', 'apple', 'cherry']);
	});

	it('handles an empty example list by keeping the original order.ts', () => {
		const array = ['apple', 'banana', 'cherry'];
		const example: string[] = [];
		const result = orderByExample(array, example);
		expect(result).toEqual(['apple', 'banana', 'cherry']);
	});

	it('handles an empty array', () => {
		const array: string[] = [];
		const example = ['banana', 'date', 'fig'];
		const result = orderByExample(array, example);
		expect(result).toEqual([]);
	});

	it('orders elements when example list contains new elements not in the array', () => {
		const array = ['apple', 'banana', 'cherry'];
		const example = ['banana', 'date', 'fig'];
		const result = orderByExample(array, example);
		expect(result).toEqual(['banana', 'apple', 'cherry']);
	});

	it('orders elements correctly when all elements are in the example list', () => {
		const array = ['apple', 'banana', 'cherry'];
		const example = ['cherry', 'banana', 'apple'];
		const result = orderByExample(array, example);
		expect(result).toEqual(['cherry', 'banana', 'apple']);
	});
});
