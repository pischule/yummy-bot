import { APP_TZ } from '$lib/server/utils';
import { bot } from '$lib/server/bot';
import { logger } from '$lib/server/logger';
import { getLocations } from '$lib/server/location';
import { getMenuFromLocation, isMenuPostedToday, menuItemsToDisplay } from '$lib/server/menu';
import type { LayoutServerLoad } from './$types';
import { authenticateAdmin } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	await authenticateAdmin(cookies, url.searchParams);
	const locations = await getLocations();
	const today = Temporal.Now.plainDateISO(APP_TZ).toJSON();
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
			items: menuItemsToDisplay(loc.menu),
			receiptDate: loc.receiptDate,
			updatedAt: loc.updatedAt,
			postedAt: loc.postedAt,
			hasActiveMenu: menu !== null,
			isPosted: isMenuPostedToday(loc),
			postedAtInstant: menu?.postedAt?.toJSON() ?? null
		};
	});

	return { locations: enriched, today, botUsername };
};
