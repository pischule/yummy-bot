import type { Actions, PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import * as bot from '$lib/server/bot';
import * as util from '$lib/server/util';

export const load = (async ({ url, locals }) => {
	const menu = await db.getMenu();
	let itemsString = menu?.items.join('\n') ?? '';

	let receiptDate: string;
	if (menu?.receiptDate) {
		receiptDate = util.dateToLocalDateString(new Date(menu.receiptDate));
	} else {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		receiptDate = util.dateToLocalDateString(tomorrow);
	}

	return { receiptDate, itemsString };
}) satisfies PageServerLoad;

const save = async (request: Request) => {
	const data = await request.formData();
	const receiptDate = <string>data.get('receiptDate');
	const itemsString = <string>data.get('items');
	const items = itemsString.trim()
		.split('\n')
		.map(item => item.trim());

	const menu = {
		updateDate: new Date().toJSON(),
		receiptDate: new Date(receiptDate).toJSON(),
		items
	} satisfies Menu;

	await db.setMenu(menu);
};

export const actions = {
	save: async ({ request }) => {
		await save(request);
	},
	send: async ({ request }) => {
		await bot.sendOrderButton();
	},
	saveAndSend: async ({ request }) => {
		await save(request);
		await bot.sendOrderButton();
	}
} satisfies Actions;