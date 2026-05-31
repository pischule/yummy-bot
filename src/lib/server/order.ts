import { ordersTable } from '$lib/server/db/schema';
import { db } from './db/store';
import { APP_TZ } from '$lib/server/utils';
import { and, eq, gte, lt } from 'drizzle-orm';

export async function saveOrder(order: {
	locationId: string;
	telegramId: string;
	name: string;
	orderedItems: { name: string; qty: number }[];
	receiptDate: string;
	createdAt: string;
	messageId?: number;
}) {
	await db.insert(ordersTable).values(order);
}

export async function getOrders(locationId: string, date: string) {
	const localDate = Temporal.PlainDate.from(date);
	const start = localDate.toZonedDateTime(APP_TZ).toInstant().toJSON();
	const end = localDate.add({ days: 1 }).toZonedDateTime(APP_TZ).toInstant().toJSON();
	return db
		.select()
		.from(ordersTable)
		.where(
			and(
				eq(ordersTable.locationId, locationId),
				gte(ordersTable.createdAt, start),
				lt(ordersTable.createdAt, end)
			)
		);
}
