import { redirect } from '@sveltejs/kit';
import { checkAdminAuth } from '$lib/server/auth';

export function load({ params }) {
	checkAdminAuth(params);
	redirect(302, `edit/menu`);
}
