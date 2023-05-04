import type { RequestHandler } from './$types';

import { sendOrderToChat } from '$lib/server/telegramService';

const usedNonces = new Set();

export const POST = (async ({ request }) => {
	const { nonce, items, name } = await request.json();
	if (usedNonces.has(nonce)) {
		return new Response(null, { status: 201 });
	}

	console.log({ nonce, items, name });

	await sendOrderToChat(name, items);
	usedNonces.add(nonce);
	return new Response(null, { status: 201 });
}) satisfies RequestHandler;