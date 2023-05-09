import type { RequestHandler } from './$types';

import * as bot from '$lib/server/bot';

const usedNonces = new Set();

export const POST = (async ({ request , locals}) => {
	const order = <Order>await request.json();
	if (usedNonces.has(order.nonce)) {
		return new Response(null, { status: 201 });
	}

	await bot.sendOrder(order, locals.userId);
	usedNonces.add(order.nonce);
	return new Response(null, { status: 201 });
}) satisfies RequestHandler;