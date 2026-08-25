import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Prevent the webview from caching and re-showing a stale login page
	setHeaders({ 'Cache-Control': 'no-store' });
	return {};
};
