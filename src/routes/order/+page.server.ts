import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';

const weekdayString = (day: number) => {
	return [
		'воскресенье',
		'понедельник',
		'вторник',
		'среду',
		'четверг',
		'пятницу',
		'субботу'
	][day];
};

export const load = (async ({ url }) => {
	const menu = await db.getMenu();

	if (!menu) {
		return {
			menu: null,
			weekday: null
		};
	}

	const weekday = weekdayString(new Date(menu.receiptDate).getDay());

	return {
		menu: await db.getMenu(),
		weekday: weekday
	};
}) satisfies PageServerLoad;
