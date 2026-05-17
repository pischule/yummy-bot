import { redirect } from '@sveltejs/kit';
import { Instant } from '@js-joda/core';
import { getOrders } from '$lib/server/database';
import { APP_TZ } from '$lib/server/utils';

export async function load({ url, parent }) {
	const { locations, today } = await parent();
	const locationId = url.searchParams.get('locationId');

	if (!locationId && locations.length > 0) {
		const params = new URLSearchParams(url.search);
		params.set('locationId', locations[0].id);
		redirect(302, `${url.pathname}?${params.toString()}`);
	}
	const ordersDate = url.searchParams.get('date') || today;

	const targetId =
		locationId && locations.some((l) => l.id === locationId)
			? locationId
			: (locations[0]?.id ?? null);

	type OrderSummary = {
		id: number;
		name: string;
		items: { name: string; qty: number }[];
		createdAt: string;
	};
	let initialOrders: { orders: OrderSummary[]; totalItems: number } = { orders: [], totalItems: 0 };
	if (targetId) {
		const orders = await getOrders(targetId, ordersDate);
		initialOrders = {
			orders: orders.map((o) => ({
				id: o.id,
				name: o.name,
				items: o.orderedItems as { name: string; qty: number }[],
				createdAt: Instant.parse(o.createdAt)
					.atZone(APP_TZ)
					.toLocalTime()
					.toString()
					.substring(0, 5)
			})),
			totalItems: orders.reduce((sum, o) => sum + o.orderedItems.reduce((a, b) => a + b.qty, 0), 0)
		};
	}

	return { initialOrders, ordersDate, selectedLocationId: targetId };
}
