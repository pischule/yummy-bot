import { ordersTable } from '$lib/server/db/schema';
import { db } from './db/store';
import { LocalDate } from '@js-joda/core';
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
	const localDate = LocalDate.parse(date);
	const start = localDate.atStartOfDay(APP_TZ).toInstant().toString();
	const end = localDate.plusDays(1).atStartOfDay(APP_TZ).toInstant().toString();

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
