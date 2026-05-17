import { env } from '$env/dynamic/private';
import { LocalDate } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';
import { getLocations, getMenuFromLocation, isMenuPostedToday } from '$lib/server/database';
import { checkAdminAuth } from '$lib/server/auth';

export async function load({ params }) {
	checkAdminAuth(params);
	const locations = await getLocations();
	const todayLocalDate = LocalDate.now(APP_TZ);
	const today = todayLocalDate.toString();

	const enriched = locations.map((loc) => {
		const menu = getMenuFromLocation(loc);
		return {
			id: loc.id,
			name: loc.name,
			chatId: loc.chatId,
			items: loc.menu as string[],
			receiptDate: loc.receiptDate,
			updatedAt: loc.updatedAt,
			postedAt: loc.postedAt,
			hasActiveMenu: menu !== null,
			isPosted: isMenuPostedToday(loc),
			postedAtInstant: menu?.postedAt?.toJSON() ?? null
		};
	});

	return { locations: enriched, today, botUsername: env.BOT_USERNAME };
}
