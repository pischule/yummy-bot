import type { MenuItem } from './db/schema';

export const APP_TZ = 'Europe/Minsk';

export function nextMidnight(): number {
	return Temporal.Now.zonedDateTimeISO(APP_TZ).round({ smallestUnit: 'day', roundingMode: 'ceil' })
		.epochMilliseconds;
}

export function groupBy<T, K>(array: T[], keyMapper: (item: T) => K): Map<K, T[]> {
	return array.reduce((map, item) => {
		const key = keyMapper(item);
		const group = map.get(key);

		if (group) {
			group.push(item);
		} else {
			map.set(key, [item]);
		}

		return map;
	}, new Map<K, T[]>());
}

export function getMenuItemNames(items: string[] | MenuItem[]): string[] {
	return items.map((item) => (typeof item === 'string' ? item : item.name));
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
