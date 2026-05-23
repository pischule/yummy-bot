import { DayOfWeek, Instant, LocalDate } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';
import { type DbLocation, getLocationByLinkId } from '$lib/server/location';
import { locationsTable } from '$lib/server/db/schema';
import { db } from '$lib/server/db/store';
import { eq } from 'drizzle-orm';

export interface Menu {
	updatedAt: Instant;
	receiptDate: LocalDate;
	items: string[];
	postedAt: Instant | null;
}

export function isMenuPostedToday(loc: DbLocation): boolean {
	if (!loc.postedAt) return false;
	const postedDate = Instant.parse(loc.postedAt).atZone(APP_TZ).toLocalDate();
	return postedDate.isEqual(LocalDate.now(APP_TZ));
}

export function getMenuFromLocation(loc: DbLocation): Menu | null {
	if (loc.menu.length === 0) return null;

	const updatedAt = loc.updatedAt ? Instant.parse(loc.updatedAt) : Instant.now();
	const today = LocalDate.now(APP_TZ);

	const updateDate = updatedAt.atZone(APP_TZ).toLocalDate();

	const dow = today.dayOfWeek();
	let defaultReceiptDate;
	if (dow === DayOfWeek.FRIDAY) {
		defaultReceiptDate = today.plusDays(3);
	} else if (dow === DayOfWeek.SATURDAY) {
		defaultReceiptDate = today.plusDays(2);
	} else {
		defaultReceiptDate = today.plusDays(1);
	}
	const receiptDate = loc.receiptDate ? LocalDate.parse(loc.receiptDate) : defaultReceiptDate;
	if (!updateDate.isEqual(today)) return null;

	const postedAt = loc.postedAt ? Instant.parse(loc.postedAt) : null;

	return { updatedAt, receiptDate, items: loc.menu, postedAt };
}

export async function getMenuByLinkId(linkId: string): Promise<Menu | null> {
	const loc = await getLocationByLinkId(linkId);
	if (!loc) return null;
	return getMenuFromLocation(loc);
}

export async function setMenuForLocation(locationId: string, menu: Menu) {
	await db
		.update(locationsTable)
		.set({
			menu: menu.items,
			updatedAt: menu.updatedAt.toJSON(),
			receiptDate: menu.receiptDate.toJSON()
		})
		.where(eq(locationsTable.id, locationId));
}

export async function markMenuAsPosted(locationId: string) {
	const postedAt = Instant.now().toJSON();
	await db.update(locationsTable).set({ postedAt }).where(eq(locationsTable.id, locationId));
}
