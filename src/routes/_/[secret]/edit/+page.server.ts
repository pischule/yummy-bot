import type { Actions, PageServerLoad, RouteParams } from './$types';
import type { DbLocation } from '$lib/server/database';
import * as db from '$lib/server/database';
import * as bot from '$lib/server/bot';
import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { DayOfWeek, Instant, LocalDate, ZonedDateTime } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';

const { SECRET, BOT_USERNAME } = env;
const CHAT_ID_RE = /^-?\d+$/;

const checkSecret = (params: RouteParams) => {
	if (SECRET !== params.secret) throw error(404, 'Not Found');
};

function suggestReceiptDate(): string {
	const now = ZonedDateTime.now(APP_TZ);
	let d = now.toLocalDate();
	const dow = d.dayOfWeek();
	if (dow === DayOfWeek.FRIDAY) d = d.plusDays(3);
	else if (dow === DayOfWeek.SATURDAY) d = d.plusDays(2);
	else d = d.plusDays(1);
	return d.toJSON();
}

function menuStatus(loc: DbLocation): 'set' | 'empty' {
	if (loc.menu.length === 0 || !loc.updatedAt) return 'empty';
	const updatedAt = Instant.parse(loc.updatedAt);
	const updateDate = updatedAt.atZone(APP_TZ).toLocalDate();
	const today = LocalDate.now(APP_TZ);
	return updateDate.isEqual(today) ? 'set' : 'empty';
}

export const load: PageServerLoad = (async ({ params, url, setHeaders }) => {
	checkSecret(params);

	const locations = await db.getLocations();
	const locationId = url.searchParams.get('locationId');

	const activeLocation = locationId ? locations.find((l) => l.id === locationId) : undefined;

	let menuItems: string[] = [];
	let receiptDate = suggestReceiptDate();

	if (activeLocation) {
		const menu = db.getMenuFromLocation(activeLocation);
		if (menu) {
			menuItems = menu.items;
			receiptDate = menu.receiptDate.toJSON();
		}
	}

	setHeaders({ 'Cache-Control': 'max-age=0' });
	return {
		locations: locations.map((l) => ({ ...l, menuStatus: menuStatus(l) })),
		activeLocationId: locationId,
		activeLocation,
		menuItems,
		receiptDate,
		botUsername: BOT_USERNAME
	};
}) satisfies PageServerLoad;

export const actions = {
	addLocation: async ({ request, params, url }) => {
		checkSecret(params);
		const data = await request.formData();
		const name = (data.get('name') as string).trim();
		const chatId = (data.get('chatId') as string).trim();
		if (!name || !chatId) return { success: false, error: 'Заполните все поля' };
		if (!CHAT_ID_RE.test(chatId)) return { success: false, error: 'Chat ID должен быть числом' };
		const existing = await db.getLocationByChatId(chatId);
		if (existing) return { success: false, error: 'Локация с таким Chat ID уже существует' };
		const id = crypto.randomUUID();
		await db.addLocation({ id, name, chatId });
		logger.info({ name, chatId }, 'added location');
		throw redirect(303, url.pathname + '?locationId=' + id);
	},

	editLocation: async ({ request, params, url }) => {
		checkSecret(params);
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = (data.get('name') as string).trim();
		const chatId = (data.get('chatId') as string).trim();
		if (!id || !name || !chatId) return { success: false, error: 'Заполните все поля' };
		if (!CHAT_ID_RE.test(chatId)) return { success: false, error: 'Chat ID должен быть числом' };
		const existing = await db.getLocationByChatId(chatId);
		if (existing && existing.id !== id)
			return { success: false, error: 'Локация с таким Chat ID уже существует' };
		await db.updateLocation(id, { name, chatId });
		logger.info({ id, name, chatId }, 'updated location');
		const activeId = url.searchParams.get('locationId');
		throw redirect(303, url.pathname + (activeId ? '?locationId=' + activeId : ''));
	},

	deleteLocation: async ({ request, params, url }) => {
		checkSecret(params);
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return { success: false };
		await db.deleteLocation(id);
		logger.info({ id }, 'deleted location');
		const activeId = url.searchParams.get('locationId');
		throw redirect(
			303,
			url.pathname + (activeId && activeId !== id ? '?locationId=' + activeId : '')
		);
	},

	save: async ({ request, params, url }) => {
		checkSecret(params);
		const data = await request.formData();
		const locationId = data.get('locationId') as string;
		if (!locationId) return { success: false, error: 'Локация не выбрана' };
		await saveMenu(locationId, data);
		throw redirect(303, url.pathname + '?locationId=' + locationId);
	},

	saveAndSend: async ({ request, params, url }) => {
		checkSecret(params);
		const data = await request.formData();
		const locationId = data.get('locationId') as string;
		if (!locationId) return { success: false, error: 'Локация не выбрана' };
		const loc = await db.getLocation(locationId);
		if (!loc) return { success: false, error: 'Локация не найдена' };
		await saveMenu(locationId, data);
		try {
			await bot.sendOrderButton(loc);
		} catch (e: any) {
			// TODO fix
			// https://grammy.dev/guide/errors
			if (e?.error_code === 400) {
				return { success: false, error: 'Чат не найден. Проверьте Chat ID локации' };
			}
			logger.error(e, 'failed to send order button');
			return { success: false, error: 'Ошибка отправки в Telegram. Проверьте Chat ID' };
		}
		throw redirect(303, url.pathname + '?locationId=' + locationId);
	}
} satisfies Actions;

async function saveMenu(locationId: string, data: FormData) {
	const receiptDate = data.get('receiptDate') as string;
	const itemsString = data.get('items') as string;
	let items = itemsString
		.trim()
		.split('\n')
		.map((item) => item.trim())
		.filter((item) => item);
	items = [...new Set(items)];

	await db.setMenu(locationId, {
		updatedAt: Instant.now(),
		receiptDate: LocalDate.parse(receiptDate),
		items
	});

	logger.info({ locationId, receiptDate, itemCount: items.length }, 'updated menu');
}
