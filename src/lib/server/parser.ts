import { deriveOrderFromRelative, generateTsv, getAllItemNames, type Order } from '$lib/ordersTsv';
import { getLocations } from '$lib/server/location';
import { getMenuItemNames } from '$lib/server/utils';

export async function ordersToTsv(rawText: string): Promise<string> {
	const orders = parseOrders(rawText);
	const itemsSortedByMenu = await deriveItemsOrderByGuessingMenu(orders);
	const allItemNames = itemsSortedByMenu ?? deriveOrderFromRelative(orders);
	return generateTsv(orders, allItemNames);
}

async function deriveItemsOrderByGuessingMenu(orders: Order[]): Promise<string[] | null> {
	const locations = await getLocations();
	if (locations.length === 0) return null;

	const itemsFromOrders = orders.flatMap((order) => order.items.map((item) => item.name));

	const winner = locations.reduce<{ score: number; menu: string[] | null }>(
		(best, current) => {
			const currentItemNames = getMenuItemNames(current.menu);
			const menuSet = new Set(currentItemNames);
			const score = itemsFromOrders.filter((name) => menuSet.has(name)).length;
			return score > best.score ? { score, menu: currentItemNames } : best;
		},
		{ score: 0, menu: null }
	);

	if (winner.score == 0 || !winner.menu) return null;

	return orderByExample(getAllItemNames(orders), getMenuItemNames(winner.menu));
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

export function orderByExample(array: string[], example: string[]): string[] {
	const indexMap = new Map();
	example.forEach((el, index) => {
		indexMap.set(el, index);
	});

	// Sort the array
	return array.sort((a, b) => {
		// Check if both elements are in the example list
		const indexA = indexMap.has(a) ? indexMap.get(a) : Infinity;
		const indexB = indexMap.has(b) ? indexMap.get(b) : Infinity;

		// Compare the indices
		return indexA - indexB;
	});
}
