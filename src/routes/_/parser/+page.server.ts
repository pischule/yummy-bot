import type { PageServerLoad } from './$types';
import { getMenu } from '$lib/server/database';

export const load: PageServerLoad = async () => {
  const menu = await getMenu();

  return {
    menu: menu?.items ?? [],
  };
};
