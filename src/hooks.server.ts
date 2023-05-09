import * as bot from '$lib/server/bot';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

bot.init();

export const handle = (({ event, resolve }) => {
	if (event.url.searchParams.has('hash')) {
		event.cookies.set('tg-auth', event.url.search, { path: '/', maxAge: 60 * 60 * 24 });
	}

	const auth = event.cookies.get('tg-auth');
	if (!auth) {
		throw error(401, 'Unauthorized');
	}

	const authData = new Map(new URLSearchParams(auth).entries());
	if (!bot.checkSignature(authData)) {
		throw error(401, 'Unauthorized');
	}

	const userId = <string>authData.get('id');
	event.locals.userId = userId;

	if (event.url.pathname.startsWith('/admin') && !bot.isAdmin(userId)) {
		console.log({ userId });
		throw error(403, 'Forbidden');
	}

	return resolve(event);
}) satisfies Handle;