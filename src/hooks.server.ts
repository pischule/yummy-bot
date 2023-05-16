import * as bot from '$lib/server/bot';
import type { Handle } from '@sveltejs/kit';

bot.init();

export const handle = (async ({ event, resolve }) => {
	if (event.url.searchParams.has('hash')) {
		event.cookies.set('tg-auth', event.url.search, { path: '/', maxAge: 60 * 60 * 24 });
	}

	const auth = event.cookies.get('tg-auth');
	if (auth) {
		const authData = new Map(new URLSearchParams(auth).entries());
		if (await bot.isSignatureValid(authData)) {
			event.locals.userId = <string>authData.get('id');
		}
	}

	return resolve(event);
}) satisfies Handle;
