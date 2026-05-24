import { error } from '@sveltejs/kit';
import { Instant, LocalDate } from '@js-joda/core';
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

	const today = LocalDate.now(APP_TZ).toJSON();
	const ordersDate = url.searchParams.get('date') || today;

	const orders = await getOrders(locationId, ordersDate);
	const initialOrders = {
		orders: orders.map((o) => ({
			id: o.id,
			name: o.name,
			items: o.orderedItems as { name: string; qty: number }[],
			createdAt: Instant.parse(o.createdAt).atZone(APP_TZ).toLocalTime().toString().substring(0, 5)
		})),
		totalItems: orders.reduce((sum, o) => sum + o.orderedItems.reduce((a, b) => a + b.qty, 0), 0)
	};

	return { initialOrders, ordersDate, selectedLocationId: locationId };
};
