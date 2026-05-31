import type { PageServerLoad } from './$types';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { authenticateUser } from '$lib/server/auth';
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

export const load: PageServerLoad = async ({ url, params, setHeaders, cookies }) => {
	const session = await authenticateUser(cookies, url.searchParams);
	if (!session) {
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
	const tomorrow = Temporal.Now.plainDateISO(APP_TZ).add({ days: 1 });
	let day: string;
	if (menu.receiptDate.equals(tomorrow)) {
		day = 'завтра';
	} else {
		day = WEEKDAYS[receiptDate.dayOfWeek - 1];
	}

	return {
		items: menu?.items ?? [],
		day,
		name: await getName(session.tgId + '')
	};
};
