import { jsonStore } from '$lib/server/jsonStore';
import { Instant, LocalDate } from '@js-joda/core';
import { APP_TZ } from './utils';

const menuStore = jsonStore<MenuInternal>('data/menu.json');
const namesStore = jsonStore<Record<string, string | undefined>>('data/names.json');

export interface Menu {
	updatedAt: Instant;
	receiptDate: LocalDate;
	items: string[];
}

interface MenuInternal {
	// iso datetime
	updatedAt: string;
	// iso date
	receiptDate: string;
	items: string[];
}

export async function getMenu(): Promise<Menu | null> {
	const menu = await menuStore.get();
	if (menu === null || menu.items.length === 0) {
		return null;
	}

	const updatedAt = Instant.parse(menu.updatedAt);
	const receiptDate = LocalDate.parse(menu.receiptDate);
	const items = menu.items;

	const updateDate = updatedAt.atZone(APP_TZ).toLocalDate();
	const today = LocalDate.now(APP_TZ);
	if (!updateDate.isEqual(today)) {
		return null;
	}
	return { updatedAt, receiptDate, items };
}

export async function setMenu(menu: Menu) {
	await menuStore.set({
		updatedAt: menu.updatedAt.toJSON(),
		receiptDate: menu.receiptDate.toJSON(),
		items: menu.items
	});
}

export async function getName(id: string) {
	const names = (await namesStore.get()) ?? {};
	return names[id];
}

export async function setName(id: string, name: string) {
	const names = (await namesStore.get()) ?? {};
	names[id] = name;
	namesStore.set(names).then();
}
