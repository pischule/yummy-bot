import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { checkClientAuth } from '$lib/server/auth';
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

export const load = (async ({ url, params, setHeaders }) => {
	const user = await checkClientAuth(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { locationId } = params;

	setHeaders({ 'Cache-Control': 'max-age=0' });

	const menu = await db.getMenu(locationId);
	if (!menu?.items) {
		return {
			items: [],
			day: '',
			name: '',
			locationId
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
		name: await getName(user.id),
		locationId
	};
}) satisfies PageServerLoad;
