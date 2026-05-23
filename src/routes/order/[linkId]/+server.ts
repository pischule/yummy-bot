import type { RequestHandler } from './$types';
import * as bot from '$lib/server/bot';
import * as db from '$lib/server/database';
import { error } from '@sveltejs/kit';
import { setName } from '$lib/server/database';
import { logger } from '$lib/server/logger';
import { checkClientAuth } from '$lib/server/auth';
import { getLocationByLinkId } from '$lib/server/location';

const usedNonces = new Set();

export const POST = (async ({ request, params, url }) => {
	const user = await checkClientAuth(url.searchParams);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const nonce = request.headers.get('Idempotency-Key');
	if (nonce && usedNonces.has(nonce)) {
		return new Response(null, { status: 201 });
	}

	const order = <Order>await request.json();

	const { linkId } = params;
	const loc = await getLocationByLinkId(linkId);
	if (!loc) throw error(404, 'Location not found');
	const locationId = loc.id;

	const messageId = await bot.sendOrder(order, user.id, loc.chatId);
	await db.saveOrder({
		locationId,
		telegramId: user.id,
		name: order.name,
		orderedItems: order.orderedItems,
		receiptDate: loc.receiptDate,
		createdAt: new Date().toISOString(),
		messageId
	});

	await setName(user.id, order.name);

	if (nonce) {
		usedNonces.add(nonce);
	}
	logger.info({ userId: user.id, order, locationId }, 'created order');
	return new Response(null, { status: 201 });
}) satisfies RequestHandler;
