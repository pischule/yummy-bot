import type { Actions, PageServerLoad, RouteParams } from './$types';
import * as db from '$lib/server/database';
import * as bot from '$lib/server/bot';
import * as util from '$lib/server/util';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

const { SECRET } = env;

const checkSecret = (params: RouteParams) => {
	if (SECRET !== params.secret) throw error(404, 'Not Found');
};


export const load = (async ({ params }) => {
	checkSecret(params);

	const menu = await db.getMenu();
	let itemsString = menu?.items.join('\n') ?? '';

	let receiptDate: string;
	if (menu?.receiptDate) {
		receiptDate = util.dateToLocalDateString(new Date(menu.receiptDate));
	} else {
		const suggestedDate = new Date();
		let daysAdded = 1;
		if (suggestedDate.getDay() == 5) {
			daysAdded = 3;
		} else if (suggestedDate.getDay() == 6) {
			daysAdded = 2;
		}
		suggestedDate.setDate(suggestedDate.getDate() + daysAdded);
		receiptDate = util.dateToLocalDateString(suggestedDate);
	}

	return { receiptDate, itemsString };
}) satisfies PageServerLoad;

const save = async (request: Request) => {
	const data = await request.formData();
	const receiptDate = <string>data.get('receiptDate');
	const itemsString = <string>data.get('items');
	const items = itemsString.trim()
		.split('\n')
		.map(item => item.trim())
		.filter(item => item);

	const menu = {
		updateDate: new Date().toJSON(),
		receiptDate: new Date(receiptDate).toJSON(),
		items
	} satisfies Menu;

	await db.setMenu(menu);
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