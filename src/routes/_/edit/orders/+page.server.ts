import { error } from '@sveltejs/kit';
import { APP_TZ } from '$lib/server/utils';
import { authenticateAdmin } from '$lib/server/auth';
import { getOrders } from '$lib/server/order';
import type { PageServerLoad } from './$types';
import { getLocationById } from '$lib/server/location';

export const load: PageServerLoad = async ({ cookies, url }) => {
	await authenticateAdmin(cookies);
	const locationId = url.searchParams.get('locationId');
	if (locationId == null || (await getLocationById(locationId)) == null) {
		error(404);
	}

	const today = Temporal.Now.plainDateISO(APP_TZ).toJSON();
	const ordersDate = url.searchParams.get('date') || today;

	const orders = await getOrders(locationId, ordersDate);
	const initialOrders = {
		orders: orders.map((o) => {
			const items = o.orderedItems as { name: string; qty: number; price?: number }[];
			return {
				id: o.id,
				name: o.name,
				items,
				total: items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0),
				createdAt: Temporal.Instant.from(o.createdAt)
					.toZonedDateTimeISO(APP_TZ)
					.toPlainTime()
					.toJSON()
					.substring(0, 5)
			};
		}),
		totalItems: orders.reduce((sum, o) => sum + o.orderedItems.reduce((a, b) => a + b.qty, 0), 0),
		totalSum: orders.reduce((sum, o) => {
			const items = o.orderedItems as { name: string; qty: number; price?: number }[];
			return sum + items.reduce((s, it) => s + (it.price ?? 0) * it.qty, 0);
		}, 0)
	};

	return { initialOrders, ordersDate, selectedLocationId: locationId };
};
