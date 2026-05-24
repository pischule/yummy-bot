import type { PageServerLoad } from './$types';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { checkClientAuth } from '$lib/server/auth';
import { ZonedDateTime } from '@js-joda/core';
import { APP_TZ } from '$lib/server/utils';
import { getMenuByLinkId } from '$lib/server/menu';

const WEEKDAYS = [
	'понедельник',
	'вторник',
	'среду',
	'четверг',
	'пятницу',
	'субботу',
	'воскресенье'
];

export const load: PageServerLoad = async ({ url, params, setHeaders }) => {
	const user = await checkClientAuth(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { linkId } = params;

	setHeaders({ 'Cache-Control': 'max-age=0' });

	const menu = await getMenuByLinkId(linkId);
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
};
