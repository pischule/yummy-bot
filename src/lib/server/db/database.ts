import { Instant, LocalDate } from '@js-joda/core';
import { eq } from 'drizzle-orm';
import { APP_TZ } from '../utils';
import { db } from './store';
import { menuTable, namesTable } from './schema';

export interface Menu {
	updatedAt: Instant;
	receiptDate: LocalDate;
	items: string[];
}

export async function getMenu(): Promise<Menu | null> {
	const menu = (await db.select().from(menuTable).where(eq(menuTable.id, 'default')).limit(1))[0];
	if (menu == null || menu.items.length === 0) {
		return null;
	}

	const updatedAt = Instant.parse(menu.updatedAt);
	const receiptDate = LocalDate.parse(menu.receiptDate);
	const items = menu.items;

	const updateDate = updatedAt.atZone(APP_TZ).toLocalDate();
	const today = LocalDate.now(APP_TZ);
	if (!updateDate.isEqual(today)) {
		return null;
	}
	return { updatedAt, receiptDate, items };
}

export async function setMenu(menu: Menu) {
	await db
		.insert(menuTable)
		.values({
			id: 'default',
			updatedAt: menu.updatedAt.toJSON(),
			receiptDate: menu.receiptDate.toJSON(),
			items: menu.items
		})
		.onConflictDoUpdate({
			target: menuTable.id,
			set: {
				updatedAt: menu.updatedAt.toJSON(),
				receiptDate: menu.receiptDate.toJSON(),
				items: menu.items
			}
		});
}

export async function getName(id: string) {
	const row = (await db.select().from(namesTable).where(eq(namesTable.telegramId, id)).limit(1))[0];
	return row?.name;
}

export async function setName(id: string, name: string) {
	await db.insert(namesTable).values({ telegramId: id, name }).onConflictDoUpdate({
		target: namesTable.telegramId,
		set: { name }
	});
}
