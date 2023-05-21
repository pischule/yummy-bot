import * as bot from '$lib/server/bot';
import type { Handle } from '@sveltejs/kit';

bot.init();

export const handle = (async ({ event, resolve }) => {
  const cookieMaxAge = 60 * 60 * 12;
  if (event.url.searchParams.has('hash')) {
    event.cookies.set('tg-auth', event.url.search, {
      path: '/',
      maxAge: cookieMaxAge,
    });
  }

  const auth = event.cookies.get('tg-auth');
  if (auth) {
    const authData = new Map(new URLSearchParams(auth).entries());
    console.log(`authData=${authData}`)
    if (await bot.isSignatureValid(authData)) {
      if (authData.get('query_id')) {
        const user = JSON.parse(authData.get('user')!);
        console.dir({user})
        event.locals.userId = <string>user.id;
      } else {
        event.locals.userId = <string>authData.get('id');
      }
    }
  }

  return resolve(event);
}) satisfies Handle;
