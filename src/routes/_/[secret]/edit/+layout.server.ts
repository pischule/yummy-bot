import { LocalDate } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';
import { checkAdminAuth } from '$lib/server/auth';
import { bot } from '$lib/server/bot';
import { logger } from '$lib/server/logger';
import { getLocations } from '$lib/server/location';
import { getMenuFromLocation, isMenuPostedToday } from '$lib/server/menu';

export async function load({ params }) {
	checkAdminAuth(params);
	const locations = await getLocations();
	const todayLocalDate = LocalDate.now(APP_TZ);
	const today = todayLocalDate.toString();
	let botUsername: string | undefined;
	try {
		botUsername = bot.botInfo.username;
	} catch (e) {
		logger.warn(e, 'Failed to fetch bot username');
	}

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

	return { locations: enriched, today, botUsername };
}
