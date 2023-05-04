import type { PageServerLoad } from './$types';
import { menu } from '$lib/server/menuService';

export const load = (() => {
	return {
		menu
	};
}) satisfies PageServerLoad;
