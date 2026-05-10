import { describe, it, expect } from 'vitest';
import { ordersToTsv } from './messagesParser';

describe('ordersToTsv', () => {
	it('should parse old win format', () => {
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

		const result = ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines).toStrictEqual([
			'Имя\t"Soda"\t"Burger"\t"Fries"',
			'"Alice"\t\t2\t1',
			'"Bob"\t3\t1\t'
		]);
	});

	it('should parse old win format with extra colon', () => {
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

		const result = ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines).toStrictEqual([
			'Имя\t"Soda"\t"Burger"\t"Fries"',
			'"Alice"\t\t2\t1',
			'"Bob"\t3\t1\t'
		]);
	});

	it('should parse mac format', () => {
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

		const result = ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines[1]).toBe('"Alice"\t\t2\t1');
		expect(lines[2]).toBe('"Bob"\t3\t1\t');
	});

	it('should parse new win format', () => {
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

		const result = ordersToTsv(text);
		const lines = result.split('\n');

		expect(lines[1]).toBe('"Alice"\t\t2\t1');
		expect(lines[2]).toBe('"Bob"\t3\t1\t');
	});

	it('should sort columns based on precedence derived from order items', () => {
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

		const result = ordersToTsv(text);
		const headers = result.split('\n')[0];

		expect(headers).toBe('Имя\t"Soda"\t"Burger"\t"Fries"');
	});

	it('should sort items with equal scores alphabetically', () => {
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

		const result = ordersToTsv(text);
		const headers = result.split('\n')[0];

		// Burger beats Fries (score 1), Soda beats Pizza (score 1)
		// Fries loses to Burger (-1), Pizza loses to Soda (-1)
		// Burger/Soda tied (1), Fries/Pizza tied (-1), alphabetical within ties
		expect(headers).toBe('Имя\t"Burger"\t"Soda"\t"Fries"\t"Pizza"');
	});

	it('should derive column order from multiple orders with overlapping items', () => {
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

		const result = ordersToTsv(text);
		const headers = result.split('\n')[0];

		// A before B (Alice), B before C (Bob), C before D (Charlie) → chain: A, B, C, D
		expect(headers).toBe('Имя\t"A"\t"B"\t"C"\t"D"');
	});

	it('should break ties alphabetically when no precedence information', () => {
		const text = `
    YummyOrderBot, [01.01.24 12:00]
    Alice:
    - Soda

    YummyOrderBot, [01.01.24 12:05]
    Bob:
    - Burger
    `;

		const result = ordersToTsv(text);
		const headers = result.split('\n')[0];

		// No pairs to compare, all tied → alphabetical
		expect(headers).toBe('Имя\t"Burger"\t"Soda"');
	});

	it('should escape double quotes in item names and user names', () => {
		const rawWithQuotes = `
    YummyOrderBot, [01.01.24 12:00]
    "Big" Ben:
    - Special "Sauce"
    `;

		const result = ordersToTsv(rawWithQuotes);

		expect(result).toContain('"Big"" Ben"');
		expect(result).toContain('"Special ""Sauce"""');
	});

	it('should return only headers if the input text is empty', () => {
		const result = ordersToTsv('');
		expect(result).toBe('Имя');
	});
});
