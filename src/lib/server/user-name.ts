import { db } from '$lib/server/db/store';
import { namesTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function getName(id: string) {
	const row = await db.select().from(namesTable).where(eq(namesTable.telegramId, id)).limit(1);
	return row[0]?.name;
}

export async function setName(id: string, name: string) {
	await db.insert(namesTable).values({ telegramId: id, name }).onConflictDoUpdate({
		target: namesTable.telegramId,
		set: { name }
	});
}
