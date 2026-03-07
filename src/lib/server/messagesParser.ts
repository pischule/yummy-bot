import { orderByExample } from '$lib/server/utils';

interface Order {
	name: string;
	items: Array<Item>;
}

interface Item {
	name: string;
	qty: number;
}

export function ordersToTsv(rawText: string, menu: string[]) {
	const orders = parseOrders(rawText);
	const allItemNames = getAllItemNames(orders);
	orderByExample(allItemNames, menu);
	return generateTsv(orders, allItemNames);
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

function getAllItemNames(orders: Order[]): string[] {
	const allItems = orders.flatMap((order) => order.items.map((item) => item.name));
	return [...new Set(allItems)].sort();
}

function generateTsv(ordersParsed: Order[], allItemNames: string[]): string {
	const csvLines = [];
	csvLines.push(['Имя', ...allItemNames.map(escapeCsvField)].join('\t'));
	ordersParsed.forEach((order) => {
		csvLines.push(generateTsvLine(order, allItemNames));
	});
	return csvLines.join('\n');
}

function generateTsvLine(order: Order, allItemNames: string[]): string {
	const itemMap = new Map(order.items.map((item) => [item.name, item.qty]));
	const line = [escapeCsvField(order.name)];
	allItemNames.forEach((itemName) => {
		const qty = itemMap.get(itemName) || '';
		line.push(qty.toString());
	});
	return line.join('\t');
}

function escapeCsvField(field: string): string {
	return '"' + field.replace(/"/g, '""') + '"';
}
