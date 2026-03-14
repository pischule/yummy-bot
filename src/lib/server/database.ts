import { APP_TZ } from './utils.ts';
import { jsonStore } from './jsonStore.ts';

const menuStore = jsonStore<Menu>('data/menu.json');
const namesStore = jsonStore<Record<string, string | undefined>>('data/names.json');

export const getMenu = async () => {
	const menu = await menuStore.get();
	if (menu === null || menu.items.length === 0) {
		return null;
	}

	const updateDate = Temporal.Instant.from(menu.updateDate)
		.toZonedDateTimeISO(APP_TZ)
		.toPlainDate();
	const today: Temporal.PlainDate = Temporal.Now.plainDateISO(APP_TZ);
	if (Temporal.PlainDate.compare(today, updateDate) != 0) {
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
