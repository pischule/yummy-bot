import type { RequestHandler } from './$types';
import * as bot from '$lib/server/bot';
import { error } from '@sveltejs/kit';
import { setName } from '$lib/server/database';
import { logger } from '$lib/server/logger';
import { authenticateUser } from '$lib/server/auth';
import { getLocationByLinkId } from '$lib/server/location';
import { saveOrder } from '$lib/server/order';

const usedNonces = new Set();

export const POST: RequestHandler = async ({ request, params, cookies }) => {
	const session = await authenticateUser(cookies);
	if (!session) {
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

	const messageId = await bot.sendOrder(order, session.tgId, loc.chatId);
	await saveOrder({
		locationId,
		telegramId: session.tgId + '',
		name: order.name,
		orderedItems: order.orderedItems,
		receiptDate: loc.receiptDate,
		createdAt: new Date().toISOString(),
		messageId
	});

	await setName(session.tgId + '', order.name);

	if (nonce) {
		usedNonces.add(nonce);
	}
	logger.info({ userId: session.tgId, order, locationId }, 'created order.ts');
	return new Response(null, { status: 201 });
};
