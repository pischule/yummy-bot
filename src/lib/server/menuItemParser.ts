import { type MenuItem } from '$lib/server/db/schema';

const PRICE_REGEX = /^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(?:BYN)?$/;

export function parseMenuItem(line: string): MenuItem {
	const m = line.match(PRICE_REGEX);
	if (!m) return { name: line, price: 0 };
	const name = m[1];
	const price = parseFloat(m[2].replace(',', '.'));
	return { name, price };
}

export function menuItemToString(item: MenuItem): string {
	if (item.price > 0) {
		return `${item.name} ${item.price} BYN`;
	}
	return item.name;
}
