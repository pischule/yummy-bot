import { checkAdminAuth } from '$lib/server/auth';

export function load({ params }) {
	checkAdminAuth(params);
}
