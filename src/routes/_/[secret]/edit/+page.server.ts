import { redirect } from '@sveltejs/kit';
import { checkAdminAuth } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	checkAdminAuth(params);
	redirect(302, `edit/menu`);
};
