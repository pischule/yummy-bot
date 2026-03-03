import { describe, it, expect } from 'vitest';
import { ordersToTsv } from './messagesParser';

describe('ordersToTsv', () => {
  const mockRawText = `
YummyOrderBot, [01.01.24 12:00]
Alice:
- Burger x2
- Fries

YummyOrderBot, [01.01.24 12:05]
Bob:
- Soda x3
- Burger
`;
  const mockMenu = ['Soda', 'Burger', 'Fries'];

  it('should correctly parse names and quantities', () => {
    const result = ordersToTsv(mockRawText, mockMenu);
    const lines = result.split('\n');

    expect(lines[1]).toBe('"Alice"\t\t2\t1');
    expect(lines[2]).toBe('"Bob"\t3\t1\t');
  });

  it('should sort columns based on the provided menu order', () => {
    const result = ordersToTsv(mockRawText, mockMenu);
    const headers = result.split('\n')[0];

    // Header should be: Имя, "Soda", "Burger", "Fries"
    expect(headers).toBe('Имя\t"Soda"\t"Burger"\t"Fries"');
  });

  it('should handle items not present in the menu by putting them at the end', () => {
    const rawWithExtra =
      `
YummyOrderBot, [01.01.24 12:00]
Charlie:
- Pizza
- Soda
`.trim() + '\n\n';

    const result = ordersToTsv(rawWithExtra, mockMenu);
    const headers = result.split('\n')[0];

    // "Pizza" is not in mockMenu, so it should be pushed to the end by orderByExample
    expect(headers).toBe('Имя\t"Soda"\t"Pizza"');
  });

  it('should escape double quotes in item names and user names', () => {
    const rawWithQuotes =
      `
YummyOrderBot, [01.01.24 12:00]
"Big" Ben:
- Special "Sauce"
`.trim() + '\n\n';

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
