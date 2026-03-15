import type { Actions, PageServerLoad, RouteParams } from './$types';
import * as db from '$lib/server/database';
import * as bot from '$lib/server/bot';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { DayOfWeek, Instant, LocalDate, ZonedDateTime, ZoneId } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';

const { SECRET } = env;

const checkSecret = (params: RouteParams) => {
	if (SECRET !== params.secret) throw error(404, 'Not Found');
};

export const load: PageServerLoad = (async ({ params, setHeaders }) => {
	checkSecret(params);

	const menu = await db.getMenu();
	let itemsString = menu?.items.join('\n') ?? '';

	let receiptDate: string;
	if (menu?.receiptDate) {
		receiptDate = menu.receiptDate.toJSON();
	} else {
		let suggestedDate: LocalDate = ZonedDateTime.now(APP_TZ).toLocalDate();
		let daysAdded = 1;
		if (suggestedDate.dayOfWeek() === DayOfWeek.FRIDAY) {
			daysAdded = 3;
		} else if (suggestedDate.dayOfWeek() === DayOfWeek.SATURDAY) {
			daysAdded = 2;
		}
		receiptDate = suggestedDate.plusDays(daysAdded).toJSON();
	}

	setHeaders({ 'Cache-Control': 'max-age=0' });
	return { receiptDate, itemsString };
}) satisfies PageServerLoad;

const save = async (request: Request) => {
	const data = await request.formData();
	const receiptDate = <string>data.get('receiptDate');
	const itemsString = <string>data.get('items');
	let items = itemsString
		.trim()
		.split('\n')
		.map((item) => item.trim())
		.filter((item) => item);
	items = [...new Set(items)];

	const menu = {
		updatedAt: Instant.now(),
		receiptDate: LocalDate.parse(receiptDate),
		items
	};

	await db.setMenu(menu);

	logger.info({ menu }, 'updated menu');
};

export const actions = {
	save: async ({ request, params }) => {
		checkSecret(params);
		await save(request);
	},
	saveAndSend: async ({ request, params }) => {
		checkSecret(params);
		await save(request);
		await bot.sendOrderButton();
	}
} satisfies Actions;
