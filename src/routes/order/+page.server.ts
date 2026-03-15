import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import * as bot from '$lib/server/bot';
import { ZonedDateTime } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';

const WEEKDAYS = [
	'понедельник',
	'вторник',
	'среду',
	'четверг',
	'пятницу',
	'субботу',
	'воскресенье'
];

export const load = (async ({ url, setHeaders }) => {
	const user = await bot.authenticate(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	setHeaders({ 'Cache-Control': 'max-age=0' });

	const menu = await db.getMenu();
	if (!menu?.items) {
		return {
			items: [],
			day: '',
			name: ''
		};
	}

	const receiptDate = menu.receiptDate;
	const tomorrow = ZonedDateTime.now(APP_TZ).toLocalDate().plusDays(1);
	let day: string;
	if (menu.receiptDate.isEqual(tomorrow)) {
		day = 'завтра';
	} else {
		day = WEEKDAYS[receiptDate.dayOfWeek().ordinal()];
	}

	return {
		items: menu?.items ?? [],
		day,
		name: await getName(user.id)
	};
}) satisfies PageServerLoad;
