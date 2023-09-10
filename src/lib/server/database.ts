import * as util from '$lib/server/util';
import { jsonStore } from '$lib/server/jsonStore';

const menuStore = jsonStore<Menu>('./data/menu.json');
const namesStore =
  jsonStore<Record<string, string | undefined>>('./data/names.json');

export const getMenu = async () => {
  const menu = await menuStore.get();
  if (menu === null || menu.items.length === 0) {
    return null;
  }

  const updateDate = util.dateToLocalDateString(new Date(menu.updateDate));
  const today = util.dateToLocalDateString();
  if (today !== updateDate) {
    return null;
  }
  return menu;
};

export const setMenu = async (menu: Menu) => {
  await menuStore.set(menu);
};

export const getName = async (id: string) => {
  const names = (await namesStore.get()) ?? {};
  return names[id];
};

export const setName = async (id: string, name: string) => {
  const names = (await namesStore.get()) ?? {};
  names[id] = name;
  namesStore.set(names).then();
};
