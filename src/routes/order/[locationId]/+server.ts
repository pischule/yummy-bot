import type { RequestHandler } from './$types';
import * as bot from '$lib/server/bot';
import * as db from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { setName } from '$lib/server/database';
import { logger } from '$lib/server/logger';

const usedNonces = new Set();

export const POST = (async ({ request, params, url }) => {
	const user = await bot.authenticate(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const nonce = request.headers.get('Idempotency-Key');
	if (nonce && usedNonces.has(nonce)) {
		return new Response(null, { status: 201 });
	}

	const order = <Order>await request.json();

	const { locationId } = params;
	const loc = await db.getLocation(locationId);
	if (!loc) throw error(404, 'Location not found');

	await bot.sendOrder(order, user.id, loc.chatId);
	await setName(user.id, order.name);

	if (nonce) {
		usedNonces.add(nonce);
	}
	logger.info({ userId: user.id, order, locationId }, 'created order');
	return new Response(null, { status: 201 });
}) satisfies RequestHandler;
