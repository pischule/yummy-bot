import type { RequestHandler } from './$types';

import * as bot from '$lib/server/bot';
import { error } from '@sveltejs/kit';
import { setName } from '$lib/server/database';

const usedNonces = new Set();

export const POST = (async ({ request, url }) => {
  const user = await bot.authenticate(url.searchParams);
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const nonce = request.headers.get('Idempotency-Key');
  if (nonce && usedNonces.has(nonce)) {
    return new Response(null, { status: 201 });
  }

  const order = <Order>await request.json();
  await bot.sendOrder(order, user.id);
  await setName(user.id, order.name);

  if (nonce) {
    usedNonces.add(nonce);
  }

  return new Response(null, { status: 201 });
}) satisfies RequestHandler;
