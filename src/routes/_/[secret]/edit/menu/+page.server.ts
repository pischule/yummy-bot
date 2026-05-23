import { fail, redirect } from '@sveltejs/kit';
import { Instant, LocalDate } from '@js-joda/core';
import { setMenu, markMenuPosted } from '$lib/server/database';
import { checkAdminAuth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { sendMenuLink } from '$lib/server/menu-link';

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

export const actions = {
	saveMenu: async ({ request, params }) => {
		checkAdminAuth(params);
		const data = await request.formData();
		const locationId = data.get('locationId') as string;
		const receiptDate = data.get('receiptDate') as string;
		const itemsRaw = (data.get('items') as string) || '';
		const items = [
			...new Set(
				itemsRaw
					.split('\n')
					.map((s) => s.trim())
					.filter(Boolean)
			)
		];

		if (!locationId || !receiptDate) {
			return fail(400, { type: 'saveMenu', error: 'Не заполнены обязательные поля' });
		}

		const now = Instant.now();
		const menu = {
			items,
			updatedAt: now,
			receiptDate: LocalDate.parse(receiptDate),
			postedAt: null
		};
		await setMenu(locationId, menu);

		return { type: 'saveMenu', locationId, receiptDate, items, updatedAt: now.toJSON() };
	},

	postMenu: async ({ request, params }) => {
		checkAdminAuth(params);
		const data = await request.formData();
		const locationId = data.get('locationId') as string;
		const receiptDate = data.get('receiptDate') as string;
		const itemsRaw = (data.get('items') as string) || '';
		const items = [
			...new Set(
				itemsRaw
					.split('\n')
					.map((s) => s.trim())
					.filter(Boolean)
			)
		];
		const chatId = data.get('chatId') as string;

		if (!locationId || !receiptDate || items.length === 0 || !chatId) {
			return fail(400, { type: 'postMenu', error: 'Не заполнены обязательные поля' });
		}

		const now = Instant.now();
		const menu = {
			items,
			updatedAt: now,
			receiptDate: LocalDate.parse(receiptDate),
			postedAt: null
		};
		await setMenu(locationId, menu);

		try {
			await sendMenuLink(locationId, chatId);
			await markMenuPosted(locationId, now.toJSON());
			return { type: 'postMenu', success: true, postedAt: now.toJSON() };
		} catch (err) {
			logger.error(err, 'postMenu: failed to send order button');
			const message =
				err instanceof Error ? err.message : 'Не удалось отправить в Telegram. Попробуйте еще раз';
			return { type: 'postMenu', success: false, error: message };
		}
	}
};
