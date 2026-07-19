import { type MenuItem } from '$lib/server/db/schema';

const PRICE_REGEX = /^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(?:BYN)?$/;

export function parseMenuItem(line: string): MenuItem {
	const disablePriceParsing = process.env.FEATURE_DISABLE_PRICE_PARSING === 'true';
	if (disablePriceParsing) return { name: line, price: 0 };
	const m = line.match(PRICE_REGEX);
	if (!m) return { name: line, price: 0 };
	const name = m[1];
	const price = Math.floor(parseFloat(m[2].replace(',', '.')) * 100) / 100;
	return { name, price };
}

export function formatPrice(price: number): string {
	return price.toFixed(2);
}

export function menuItemToString(item: MenuItem): string {
	if (item.price > 0) {
		return `${item.name} ${formatPrice(item.price)} BYN`;
	}
	return item.name;
}
