import { Instant, LocalDate } from '@js-joda/core';
import { eq } from 'drizzle-orm';
import { APP_TZ } from '../utils';
import { db } from './store';
import { locationsTable, namesTable, ordersTable } from './schema';

export interface Menu {
	updatedAt: Instant;
	receiptDate: LocalDate;
	items: string[];
}

export interface DbLocation {
	id: string;
	name: string;
	chatId: string;
	menu: string[];
	updatedAt: string;
	receiptDate: string;
}

export async function getLocations(): Promise<DbLocation[]> {
	return db.select().from(locationsTable);
}

export async function getLocation(id: string): Promise<DbLocation | undefined> {
	const rows = await db.select().from(locationsTable).where(eq(locationsTable.id, id)).limit(1);
	return rows[0];
}

export async function getLocationByChatId(chatId: string): Promise<DbLocation | undefined> {
	const rows = await db
		.select()
		.from(locationsTable)
		.where(eq(locationsTable.chatId, chatId))
		.limit(1);
	return rows[0];
}

export async function addLocation(loc: { id: string; name: string; chatId: string }) {
	await db.insert(locationsTable).values({
		id: loc.id,
		name: loc.name,
		chatId: loc.chatId,
		menu: [],
		updatedAt: '',
		receiptDate: ''
	});
}

export async function updateLocation(id: string, data: { name: string; chatId: string }) {
	await db
		.update(locationsTable)
		.set({ name: data.name, chatId: data.chatId })
		.where(eq(locationsTable.id, id));
}

export async function deleteLocation(id: string) {
	await db.delete(locationsTable).where(eq(locationsTable.id, id));
}

export function getMenuFromLocation(loc: DbLocation): Menu | null {
	if (loc.menu.length === 0) return null;

	const updatedAt = loc.updatedAt ? Instant.parse(loc.updatedAt) : Instant.now();
	const receiptDate = loc.receiptDate ? LocalDate.parse(loc.receiptDate) : LocalDate.now(APP_TZ);

	const updateDate = updatedAt.atZone(APP_TZ).toLocalDate();
	const today = LocalDate.now(APP_TZ);
	if (!updateDate.isEqual(today)) return null;

	return { updatedAt, receiptDate, items: loc.menu };
}

export async function getMenu(locationId: string): Promise<Menu | null> {
	const loc = await getLocation(locationId);
	if (!loc) return null;
	return getMenuFromLocation(loc);
}

export async function setMenu(locationId: string, menu: Menu) {
	await db
		.update(locationsTable)
		.set({
			menu: menu.items,
			updatedAt: menu.updatedAt.toJSON(),
			receiptDate: menu.receiptDate.toJSON()
		})
		.where(eq(locationsTable.id, locationId));
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

export async function saveOrder(order: {
	locationId: string;
	telegramId: string;
	name: string;
	orderedItems: { name: string; qty: number }[];
	receiptDate: string;
	createdAt: string;
}) {
	await db.insert(ordersTable).values(order);
}
