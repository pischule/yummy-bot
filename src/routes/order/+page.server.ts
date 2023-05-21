import type { PageServerLoad } from './$types';
import * as db from '$lib/server/database';
import { getName } from '$lib/server/database';
import { error } from '@sveltejs/kit';
import * as bot from '$lib/server/bot';

const WEEKDAYS = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среду',
  'четверг',
  'пятницу',
  'субботу',
];

export const load = (async ({ url, setHeaders }) => {
  const user = await bot.authenticate(url.searchParams);
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  setHeaders({ 'Cache-Control': 'max-age=0' });
  const menu = await db.getMenu();
  return {
    menu,
    weekday: menu ? WEEKDAYS[new Date(menu.receiptDate).getDay()] : '?',
    name: await getName(user.id),
  };
}) satisfies PageServerLoad;
