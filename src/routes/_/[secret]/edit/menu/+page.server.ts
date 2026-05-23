import { fail, redirect } from '@sveltejs/kit';
import { Instant, LocalDate } from '@js-joda/core';
import { checkAdminAuth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { sendMenuLink } from '$lib/server/menu-link';
import { getLocationById } from '$lib/server/location';
import { markMenuAsPosted, setMenuForLocation, type Menu } from '$lib/server/menu';

function parseItems(data: FormData): string[] {
	const raw = (data.get('items') as string) || '';
	return [
		...new Set(
			raw
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean)
		)
	];
}

type Params = { secret: string };
type SaveResult = { locationId: string; receiptDate: string; items: string[]; menu: Menu };

async function saveMenuCore(data: FormData, params: Params): Promise<SaveResult | null> {
	checkAdminAuth(params);
	const locationId = data.get('locationId') as string;
	const receiptDate = data.get('receiptDate') as string;
	const items = parseItems(data);
	if (!locationId || !receiptDate) return null;
	const menu: Menu = {
		items,
		updatedAt: Instant.now(),
		receiptDate: LocalDate.parse(receiptDate),
		postedAt: null
	};
	await setMenuForLocation(locationId, menu);
	return { locationId, receiptDate, items, menu };
}

export async function load({ url, parent, params }) {
	checkAdminAuth(params);
	const { locations } = await parent();
	const locationId = url.searchParams.get('locationId');

	if (!locationId && locations.length > 0) {
		const params = new URLSearchParams(url.search);
		params.set('locationId', locations[0].id);
		redirect(302, `${url.pathname}?${params.toString()}`);
	}

	const loc = locations.find((l) => l.id === locationId) ?? null;
	return { selectedLocation: loc };
}

async function saveMenu({ request, params }: { request: Request; params: Params }) {
	const result = await saveMenuCore(await request.formData(), params);
	if (!result) return fail(400, { type: 'saveMenu', error: 'Не заполнены обязательные поля' });
	return {
		type: 'saveMenu',
		locationId: result.locationId,
		receiptDate: result.receiptDate,
		items: result.items,
		updatedAt: result.menu.updatedAt.toJSON()
	};
}

async function postMenu({ request, params }: { request: Request; params: Params }) {
	const data = await request.formData();
	const result = await saveMenuCore(data, params);
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

export const actions = { saveMenu, postMenu };
