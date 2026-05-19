import { deriveOrderFromRelative, generateTsv, getAllItemNames, type Order } from '$lib/ordersTsv';
import { getLocations } from '$lib/server/database';
import { orderByExample } from '$lib/server/utils';

export async function ordersToTsv(rawText: string): Promise<string> {
	const orders = parseOrders(rawText);
	const orderFromMenu = await deriveOrderByGuessedMenu(orders);
	const allItemNames = orderFromMenu ?? deriveOrderFromRelative(orders);
	return generateTsv(orders, allItemNames);
}

async function deriveOrderByGuessedMenu(orders: Order[]): Promise<string[] | null> {
	const locations = await getLocations();
	if (locations.length === 0) return null;

	const orderedNames = orders.flatMap((order) => order.items.map((item) => item.name));

	const winner = locations.reduce<{ score: number; menu: string[] | null }>(
		(best, current) => {
			const menuSet = new Set(current.menu);
			const score = orderedNames.filter((name) => menuSet.has(name)).length;
			return score > best.score ? { score, menu: current.menu } : best;
		},
		{ score: 0, menu: null }
	);

	if (winner.score == 0 || !winner.menu) return null;

	return orderByExample(getAllItemNames(orders), winner.menu);
}

interface Item {
	name: string;
	qty: number;
}

function parseOrders(rawText: string): Order[] {
	const lines = rawText
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line);
	if (!lines) return [];

	if (isHeaderWithoutName(lines[0])) {
		return parseWithNameOnNewLine(lines);
	} else {
		return parseWithNameOnSameLine(lines);
	}
}

function isHeaderWithoutName(line: string): boolean {
	const macRegex = /^> YummyOrderBot:$/;
	const winRegex = /^YummyOrderBot, \[.+\]:?$/;
	return winRegex.test(line) || macRegex.test(line);
}

function parseWithNameOnNewLine(lines: string[]): Order[] {
	const orders: Order[] = [];
	let currentOrder: Order | null = null;
	let previousLineIsHeader = false;
	for (const line of lines) {
		const item = parseItem(line);
		if (isHeaderWithoutName(line)) {
			previousLineIsHeader = true;
		} else if (previousLineIsHeader) {
			previousLineIsHeader = false;
			if (currentOrder) {
				orders.push(currentOrder);
			}
			const name = line.trim().slice(0, -1);
			currentOrder = { name, items: [] };
		} else if (item && currentOrder) {
			currentOrder.items.push(item);
		} else {
			if (currentOrder) {
				orders.push(currentOrder);
				currentOrder = null;
			}
		}
	}
	if (currentOrder) orders.push(currentOrder);
	return orders;
}

function parseItem(line: string): Item | null {
	const match = line.match(/^- (.*?)(?:\sx(\d+))?$/);
	if (!match) return null;
	const [, itemName, qty] = match;
	return { name: itemName || '', qty: parseInt(qty) || 1 };
}

function parseWithNameOnSameLine(lines: string[]): Order[] {
	const orders: Order[] = [];
	let currentOrder: Order | null = null;
	for (const line of lines) {
		const name = parseNameFromAlternativeHeader(line);
		const item = parseItem(line);
		if (name) {
			if (currentOrder) {
				orders.push(currentOrder);
			}
			currentOrder = { name, items: [] };
		} else if (item && currentOrder) {
			currentOrder.items.push(item);
		} else {
			if (currentOrder) {
				orders.push(currentOrder);
				currentOrder = null;
			}
		}
	}
	if (currentOrder) orders.push(currentOrder);
	return orders;
}

function parseNameFromAlternativeHeader(line: string): string | null {
	const match = line.match(/^\[.+\] YummyOrderBot:\s*(.+):$/);
	if (!match) return null;
	return match[1].trim();
}
