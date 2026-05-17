export interface Item {
	name: string;
	qty: number;
}

export interface Order {
	name: string;
	items: Item[];
}

export function deriveMenuOrder(orders: Order[]): string[] {
	const before: Record<string, Record<string, number>> = {};

	for (const order of orders) {
		const names = order.items.map((i) => i.name);
		for (let i = 0; i < names.length; i++) {
			for (let j = i + 1; j < names.length; j++) {
				before[names[i]] ??= {};
				before[names[i]][names[j]] = (before[names[i]][names[j]] ?? 0) + 1;
			}
		}
	}

	const items = getAllItemNames(orders);
	const score = (item: string) => {
		let s = 0;
		for (const other of items) {
			if (other === item) continue;
			s += before[item]?.[other] ?? 0;
			s -= before[other]?.[item] ?? 0;
		}
		return s;
	};

	return items.sort((a, b) => {
		const diff = score(b) - score(a);
		if (diff !== 0) return diff;
		return a.localeCompare(b);
	});
}

function getAllItemNames(orders: Order[]): string[] {
	const allItems = orders.flatMap((order) => order.items.map((item) => item.name));
	return [...new Set(allItems)].sort();
}

export function generateTsv(ordersParsed: Order[], allItemNames: string[]): string {
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

export function escapeCsvField(field: string): string {
	return '"' + field.replace(/"/g, '""') + '"';
}
