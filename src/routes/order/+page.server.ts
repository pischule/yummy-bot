import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import * as bot from '$lib/server/bot';
import { APP_TZ } from '$lib/server/utils';

const WEEKDAYS = [
	'',
	'понедельник',
	'вторник',
	'среду',
	'четверг',
	'пятницу',
	'субботу',
	'воскресенье'
];

const DAY_DIFF_LABELS = ['сегодня', 'завтра', 'послезавтра'];

export const load = (async ({ url, setHeaders }) => {
	const user = await bot.authenticate(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	setHeaders({ 'Cache-Control': 'max-age=0' });
	const menu: Menu | null = await db.getMenu();
	const name = await getName(user.id);

	if (!menu?.items) {
		return {
			items: [],
			weekday: '?',
			name
		};
	}

	const receiptDate = Temporal.PlainDate.from(menu.receiptDate);
	const today = Temporal.Now.plainDateISO(APP_TZ);
	const daysDiff = receiptDate.since(today).days;
	const dayName = DAY_DIFF_LABELS[daysDiff] ?? WEEKDAYS[receiptDate.dayOfWeek];

	return {
		items: menu.items ?? [],
		weekday: dayName,
		name: await getName(user.id)
	};
}) satisfies PageServerLoad;
