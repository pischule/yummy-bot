import { APP_TZ } from '$lib/server/utils';
import { type DbLocation, getLocationByLinkId } from '$lib/server/location';
import { locationsTable, type MenuItem } from '$lib/server/db/schema';
import { db } from '$lib/server/db/store';
import { eq } from 'drizzle-orm';

export interface Menu {
	updatedAt: Temporal.Instant;
	receiptDate: Temporal.PlainDate;
	items: MenuItem[];
	postedAt: Temporal.Instant | null;
}

export function normalizeMenuItems(items: string[] | MenuItem[]): MenuItem[] {
	return items.map((item) => (typeof item === 'string' ? { name: item, price: 0 } : item));
}

export function menuItemsToDisplay(items: string[] | MenuItem[]): string {
	return normalizeMenuItems(items)
		.map((item) => {
			if (item.price > 0) {
				return `${item.name} ${item.price} BYN`;
			}
			return item.name;
		})
		.join('\n');
}

export function isMenuPostedToday(loc: DbLocation): boolean {
	if (!loc.postedAt) return false;
	const postedDate = Temporal.Instant.from(loc.postedAt).toZonedDateTimeISO(APP_TZ).toPlainDate();
	const today = Temporal.Now.plainDateISO(APP_TZ);
	return postedDate.equals(today);
}

export function getMenuFromLocation(loc: DbLocation): Menu | null {
	if (loc.menu.length === 0) return null;

	const updatedAt = loc.updatedAt ? Temporal.Instant.from(loc.updatedAt) : Temporal.Now.instant();
	const today = Temporal.Now.plainDateISO(APP_TZ);

	const updateDate = updatedAt.toZonedDateTimeISO(APP_TZ).toPlainDate();

	const dow = today.dayOfWeek;
	let defaultReceiptDate;
	if (dow === 5) {
		defaultReceiptDate = today.add({ days: 3 });
	} else if (dow === 6) {
		defaultReceiptDate = today.add({ days: 2 });
	} else {
		defaultReceiptDate = today.add({ days: 1 });
	}
	const receiptDate: Temporal.PlainDate = loc.receiptDate
		? Temporal.PlainDate.from(loc.receiptDate)
		: defaultReceiptDate;
	if (!updateDate.equals(today)) return null;

	const postedAt = loc.postedAt ? Temporal.Instant.from(loc.postedAt) : null;

	const items = normalizeMenuItems(loc.menu);

	return { updatedAt, receiptDate, items, postedAt };
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
	const postedAt = Temporal.Now.instant().toJSON();
	await db.update(locationsTable).set({ postedAt }).where(eq(locationsTable.id, locationId));
}
