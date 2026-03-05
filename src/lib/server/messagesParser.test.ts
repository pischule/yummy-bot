import { describe, it, expect } from 'vitest';
import { ordersToTsv } from './messagesParser';

describe('ordersToTsv', () => {
  const mockMenu = ['Soda', 'Burger', 'Fries'];

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

    const result = ordersToTsv(text, mockMenu);
    const lines = result.split('\n');

    expect(lines).toStrictEqual([
      'Имя\t"Soda"\t"Burger"\t"Fries"',
      '"Alice"\t\t2\t1',
      '"Bob"\t3\t1\t',
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

    const result = ordersToTsv(text, mockMenu);
    const lines = result.split('\n');

    expect(lines).toStrictEqual([
      'Имя\t"Soda"\t"Burger"\t"Fries"',
      '"Alice"\t\t2\t1',
      '"Bob"\t3\t1\t',
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

    const result = ordersToTsv(text, mockMenu);
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

    const result = ordersToTsv(text, mockMenu);
    const lines = result.split('\n');

    expect(lines[1]).toBe('"Alice"\t\t2\t1');
    expect(lines[2]).toBe('"Bob"\t3\t1\t');
  });

  it('should sort columns based on the provided menu order', () => {
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

    const result = ordersToTsv(text, mockMenu);
    const headers = result.split('\n')[0];

    // Header should be: Имя, "Soda", "Burger", "Fries"
    expect(headers).toBe('Имя\t"Soda"\t"Burger"\t"Fries"');
  });

  it('should handle items not present in the menu by putting them at the end', () => {
    const rawWithExtra = `
    YummyOrderBot, [01.01.24 12:00]
    Charlie:
    - Pizza
    - Soda
    `;

    const result = ordersToTsv(rawWithExtra, mockMenu);
    const headers = result.split('\n')[0];

    // "Pizza" is not in mockMenu, so it should be pushed to the end by orderByExample
    expect(headers).toBe('Имя\t"Soda"\t"Pizza"');
  });

  it('should escape double quotes in item names and user names', () => {
    const rawWithQuotes = `
    YummyOrderBot, [01.01.24 12:00]
    "Big" Ben:
    - Special "Sauce"
    `;

    const result = ordersToTsv(rawWithQuotes, []);

    // escapeCsvField should turn " into "" and wrap in "
    expect(result).toContain('"Big"" Ben"');
    expect(result).toContain('"Special ""Sauce"""');
  });

  it('should return only headers if the input text is empty', () => {
    const result = ordersToTsv('', []);
    expect(result).toBe('Имя');
  });
});
