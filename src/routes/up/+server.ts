import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET = (async () => {
  return json({ ok: true });
}) satisfies RequestHandler;
