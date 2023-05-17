import * as bot from '$lib/server/bot';
import type { Handle } from '@sveltejs/kit';

bot.init();

export const handle = (async ({ event, resolve }) => {
	const cookieMaxAge = 60 * 60 * 12;
	if (event.url.searchParams.has('hash')) {
		event.cookies.set('tg-auth', event.url.search, { path: '/', maxAge: cookieMaxAge });
	}

	const auth = event.cookies.get('tg-auth');
	if (auth) {
		const authData = new Map(new URLSearchParams(auth).entries());
		if (await bot.isSignatureValid(authData)) {
			const authDate = parseInt(<string>authData.get('auth_date'));
			const nowDate = Date.now() / 1000;
			const isNotStale = nowDate - authDate < cookieMaxAge * 2;
			if (isNotStale) {
				event.locals.userId = <string>authData.get('id');
			}
		}
	}

	return resolve(event);
}) satisfies Handle;
