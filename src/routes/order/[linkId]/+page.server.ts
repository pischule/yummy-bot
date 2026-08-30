import type { PageServerLoad } from './$types';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { authenticateUser } from '$lib/server/auth';
import { APP_TZ } from '$lib/server/utils';
import { getMenuFromLocation } from '$lib/server/menu';
import { getLocationByLinkId } from '$lib/server/location';
import { getBotUsername } from '$lib/server/bot';

const STALE_LINK_MESSAGE = 'Ссылка устарела. Нажмите кнопку «Создать заказ» в чате ещё раз';

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
	const { linkId } = params;

	const location = await getLocationByLinkId(linkId);
	if (!location) {
		throw error(404, {
			message: 'Not Found',
			description: STALE_LINK_MESSAGE
		});
	}

	const { session, reason } = await authenticateUser(cookies, url.searchParams);
	if (!session) {
		throw error(401, {
			message: 'Unauthorized',
			description: reason === 'stale' ? STALE_LINK_MESSAGE : undefined,
			showLoginHelp: reason === 'missing-params' || reason === 'invalid-signature',
			botUsername: await getBotUsername(),
			linkId
		});
	}

	setHeaders({ 'Cache-Control': 'max-age=0' });

	const menu = getMenuFromLocation(location);
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
