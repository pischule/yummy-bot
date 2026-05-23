import { db } from '$lib/server/db/store';
import { locationsTable, menuLinkTable } from './db/schema';
import { eq } from 'drizzle-orm';

export type DbLocation = typeof locationsTable.$inferSelect;

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

export async function getLocations(): Promise<DbLocation[]> {
	return db.select().from(locationsTable);
}

export async function getLocationByLinkId(linkId: string): Promise<DbLocation> {
	const rows = await db
		.select()
		.from(locationsTable)
		.innerJoin(menuLinkTable, eq(locationsTable.id, menuLinkTable.locationId))
		.where(eq(menuLinkTable.id, linkId))
		.limit(1);
	return rows[0]?.locations;
}

export async function getLocationByChatId(chatId: string): Promise<DbLocation | undefined> {
	const rows = await db
		.select()
		.from(locationsTable)
		.where(eq(locationsTable.chatId, chatId))
		.limit(1);
	return rows[0];
}
