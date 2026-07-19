import { fail, redirect } from '@sveltejs/kit';
import { authenticateAdmin } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { sendMenuLink } from '$lib/server/menu-link';
import { getLocationById } from '$lib/server/location';
import { markMenuAsPosted, setMenuForLocation, type Menu } from '$lib/server/menu';
import { type MenuItem } from '$lib/server/db/schema';
import { parseMenuItem } from '$lib/server/menuItemParser';
import type { PageServerLoad, Actions } from './$types';

function parseItems(data: FormData): MenuItem[] {
	const raw = (data.get('items') as string) || '';
	return raw
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean)
		.map(parseMenuItem);
}

type SaveResult = { locationId: string; receiptDate: string; items: MenuItem[]; menu: Menu };

async function saveMenuCore(data: FormData): Promise<SaveResult | null> {
	const locationId = data.get('locationId') as string;
	const receiptDate = data.get('receiptDate') as string;
	const items = parseItems(data);
	if (!locationId || !receiptDate) return null;
	const menu: Menu = {
		items,
		updatedAt: Temporal.Now.instant(),
		receiptDate: Temporal.PlainDate.from(receiptDate),
		postedAt: null
	};
	await setMenuForLocation(locationId, menu);
	return { locationId, receiptDate, items, menu };
}

export const load: PageServerLoad = async ({ url, parent, cookies }) => {
	await authenticateAdmin(cookies);
	const { locations } = await parent();
	const locationId = url.searchParams.get('locationId');

	if (!locationId && locations.length > 0) {
		const params = new URLSearchParams(url.search);
		params.set('locationId', locations[0].id);
		redirect(302, `${url.pathname}?${params.toString()}`);
	}

	const loc = locations.find((l) => l.id === locationId) ?? null;
	return { selectedLocation: loc };
};

export const actions = {
	saveMenu: async ({ request, cookies }) => {
		await authenticateAdmin(cookies);
		const result = await saveMenuCore(await request.formData());
		if (!result) return fail(400, { type: 'saveMenu', error: 'Не заполнены обязательные поля' });
		return {
			type: 'saveMenu',
			locationId: result.locationId,
			receiptDate: result.receiptDate,
			items: result.items,
			updatedAt: result.menu.updatedAt.toJSON()
		};
	},

	postMenu: async ({ request, cookies }) => {
		await authenticateAdmin(cookies);
		const data = await request.formData();
		const result = await saveMenuCore(data);
		if (!result) return fail(400, { type: 'postMenu', error: 'Не заполнены обязательные поля' });
		if (result.items.length === 0)
			return fail(400, { type: 'postMenu', error: 'Не заполнены обязательные поля' });
		const loc = await getLocationById(result.locationId);
		if (!loc?.chatId) return fail(400, { type: 'postMenu', error: 'Локация не найдена' });
		try {
			await sendMenuLink(result.locationId, loc.chatId);
			await markMenuAsPosted(result.locationId);
			return { type: 'postMenu', success: true, postedAt: result.menu.updatedAt.toJSON() };
		} catch (err) {
			logger.error(err, 'postMenu: failed to send order.ts button');
			return {
				type: 'postMenu',
				success: false,
				error:
					err instanceof Error ? err.message : 'Не удалось отправить в Telegram. Попробуйте еще раз'
			};
		}
	}
} satisfies Actions;
