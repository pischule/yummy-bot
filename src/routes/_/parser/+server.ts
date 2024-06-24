import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { ordersToTsv } from '$lib/server/messagesParser';
import { getMenu } from '$lib/server/database';

export const POST = (async ({ request }) => {
  const { text } = await request.json();
  const menu = await getMenu();
  const menuItems = menu?.items ?? [];
  const tsv = ordersToTsv(text, menuItems);
  return json({ data: tsv });
}) satisfies RequestHandler;
