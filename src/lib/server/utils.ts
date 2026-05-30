import { ZoneId, LocalDate } from '@js-joda/core';
import '@js-joda/timezone';

export const APP_TZ = ZoneId.of('Europe/Minsk');

export function nextMidnight(): number {
	return LocalDate.now(APP_TZ).plusDays(1).atStartOfDay(APP_TZ).toInstant().toEpochMilli();
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

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
