import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { ordersToTsv } from '$lib/server/messagesParser';

export const POST = (async ({ request }) => {
	const { text } = await request.json();
	const tsv = ordersToTsv(text, []);
	return json({ data: tsv });
}) satisfies RequestHandler;
