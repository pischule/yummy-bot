import type { PageServerLoad } from './$types';
import { menu } from '$lib/server/menuService';

export const load = (async () => {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const date = tomorrow.toISOString().split('T')[0];

	let itemsString = '';
	if (menu) {
		itemsString = menu.items.join('\n');
	}

	return {
		date,
		items: itemsString
	};
}) satisfies PageServerLoad;