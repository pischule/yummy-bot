import { orderByExample } from '$lib/utils';

interface Order {
  name: string;
  items: Array<Item>;
}

interface Item {
  name: string;
  qty: number;
}

function escapeCsvField(field: string) {
  return '"' + field.replace(/"/g, '""') + '"';
}

function parseBotOrder(text: string) {
  const [nameWithColon, ...items] = text.trim().split('\n').slice(1);
  const name = nameWithColon.substring(0, nameWithColon.length - 1);
  const parsedItems = items.map((line) => {
    const [, itemName, qty] = line.match(itemRegex) || [];
    return { name: itemName || '', qty: parseInt(qty) || 1 };
  });
  return { name, items: parsedItems };
}

function getAllItemNames(orders: Array<Order>) {
  const allItems = orders.flatMap((order) =>
    order.items.map((item) => item.name),
  );
  return [...new Set(allItems)].sort();
}

function generateCsvLine(order: Order, allItemNames: Array<string>) {
  const itemMap = new Map(order.items.map((item) => [item.name, item.qty]));
  const line = [escapeCsvField(order.name)];
  allItemNames.forEach((itemName) => {
    const qty = itemMap.get(itemName) || '';
    line.push(qty.toString());
  });
  return line.join('\t');
}

function generateTsv(ordersParsed: Array<Order>, allItemNames: Array<string>) {
  const csvLines = [];
  csvLines.push(['Имя', ...allItemNames.map(escapeCsvField)].join('\t'));
  ordersParsed.forEach((order) => {
    csvLines.push(generateCsvLine(order, allItemNames));
  });
  return csvLines.join('\n');
}

const orderRegex = /(YummyOrderBot, \[.+](\n.+)+)\n\n/gm;
const itemRegex = /^- (.*?)(?:\sx(\d+))?$/;

export function ordersToTsv(rawText: string, menu: string[]) {
  const botTextOrders = (rawText + '\n\n').matchAll(orderRegex);
  const ordersParsed = [...botTextOrders].map((match) =>
    parseBotOrder(match[0]),
  );
  const allItemNames = getAllItemNames(ordersParsed);
  orderByExample(allItemNames, menu);
  return generateTsv(ordersParsed, allItemNames);
}
