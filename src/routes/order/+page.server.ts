import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { error } from '@sveltejs/kit';

const WEEKDAYS = [
	'воскресенье',
	'понедельник',
	'вторник',
	'среду',
	'четверг',
	'пятницу',
	'субботу'
];

export const load = (async ({ locals }) => {
	if (!locals.userId) {
		throw error(401, 'Unauthorized');
	}

	const menu = await db.getMenu();
	if (!menu) {
		return {
			menu: null,
			weekday: null
		};
	}

	const weekday = WEEKDAYS[new Date(menu.receiptDate).getDay()];

	return {
		menu: await db.getMenu(),
		weekday: weekday
	};
}) satisfies PageServerLoad;
