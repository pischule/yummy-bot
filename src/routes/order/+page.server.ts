import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { getName } from '$lib/server/database';
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
	return {
		menu,
		weekday: menu ? WEEKDAYS[new Date(menu.receiptDate).getDay()] : undefined,
		name: await getName(locals.userId)
	};
}) satisfies PageServerLoad;
