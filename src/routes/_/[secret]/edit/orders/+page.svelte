<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { deriveMenuOrder, generateTsv } from '$lib/ordersTsv';
	import Button from '$lib/Button.svelte';

	let { data } = $props();

	let ordersDate = $state(data.ordersDate);

	let orders = $state<
		{ id: number; name: string; items: { name: string; qty: number }[]; createdAt: string }[]
	>(data.initialOrders.orders);

	let copyStatusVisible = $state(false);

	$effect(() => {
		ordersDate = data.ordersDate;
		orders = data.initialOrders.orders;
	});

	const icons = {
		calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
		copy: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
		user: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
		clock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
		check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
	};
</script>

<div class="page-header">
	<div class="title-group">
		<h2>Заказы</h2>
		{#if data.selectedLocationId}
			{@const loc = data.locations.find((l) => l.id === data.selectedLocationId)}
			<p class="subtitle">Локация: <strong>{loc?.name || '...'}</strong></p>
		{:else}
			<p class="subtitle">Выберите локацию слева</p>
		{/if}
	</div>

	<div class="header-actions">
		<div class="date-selector">
			<input
				type="date"
				value={ordersDate}
				onchange={(e: Event) => {
					const val = (e.target as HTMLInputElement).value;
					ordersDate = val;
					const u = new URL($page.url);
					u.searchParams.set('date', val);
					goto(u.toString(), { keepFocus: true, noScroll: true, replaceState: true });
				}}
			/>
		</div>

		<Button
			sm
			primary
			flat
			disabled={orders.length === 0}
			onclick={async () => {
				if (orders.length === 0) return;
				const itemOrder = deriveMenuOrder(orders);
				const tsv = generateTsv(orders, itemOrder);
				try {
					await navigator.clipboard.writeText(tsv);
					copyStatusVisible = true;
					setTimeout(() => {
						copyStatusVisible = false;
					}, 3000);
				} catch {
					alert('Не удалось скопировать. Выделите текст вручную.');
				}
			}}
		>
			<span class="icon-inline">{@html icons.copy}</span>
			TSV
		</Button>
	</div>
</div>

{#if copyStatusVisible}
	<div class="banner success">
		{@html icons.check}
		<span>Скопировано в буфер обмена (TSV)</span>
	</div>
{/if}

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>
					<span class="icon-inline">{@html icons.user}</span>
					Клиент
				</th>
				<th>Позиции</th>
				<th class="time-col">
					<span class="icon-inline">{@html icons.clock}</span>
					Время
				</th>
			</tr>
		</thead>
		<tbody>
			{#if !data.selectedLocationId}
				<tr>
					<td colspan="3" class="empty-state">Выберите локацию для просмотра заказов.</td>
				</tr>
			{:else if orders.length === 0}
				<tr>
					<td colspan="3" class="empty-state">На эту дату заказов пока нет.</td>
				</tr>
			{:else}
				{#each orders as order (order.id)}
					<tr>
						<td class="name-cell">{order.name}</td>
						<td class="items-cell">
							<div class="items-list">
								{#each order.items as item}
									<span class="order-item">
										{item.name}
										{#if item.qty > 1}
											<span class="qty">×{item.qty}</span>
										{/if}
									</span>
								{/each}
							</div>
						</td>
						<td class="time-col">{order.createdAt}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.title-group h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.subtitle {
		margin: 0.15rem 0 0;
		color: var(--color-muted);
		font-size: 0.8rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.date-selector {
		display: flex;
		align-items: center;
		background: var(--color-bg);
		border: 1px solid var(--color-subtle);
		border-radius: 4px;
		padding: 0 0.4rem;
		height: 32px;
	}

	.date-selector input {
		border: none;
		background: none;
		font-family: inherit;
		font-size: 0.8rem;
		color: var(--color-fg);
		outline: none;
		padding: 0.2rem;
	}

	.icon-inline {
		display: inline-flex;
		vertical-align: middle;
	}

	.banner {
		padding: 0.6rem 0.85rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.8rem;
		background-color: var(--color-success-bg);
		color: var(--color-success-strong);
		border: 1px solid var(--color-success-border);
	}

	.table-container {
		background: var(--color-bg);
		border: 1px solid var(--color-subtle);
		border-radius: 6px;
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.875rem;
	}

	thead th {
		padding: 0.6rem 0.85rem;
		background: var(--color-surface-bg);
		border-bottom: 1px solid var(--color-subtle);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--color-muted);
	}

	tbody td {
		padding: 0.65rem 0.85rem;
		border-bottom: 1px solid var(--color-subtle);
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.name-cell {
		font-weight: 600;
		white-space: nowrap;
		min-width: 150px;
	}

	.items-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.order-item {
		background: var(--color-hover-bg);
		padding: 0.15rem 0.45rem;
		border-radius: 3px;
		font-size: 0.8rem;
		border: 1px solid var(--color-subtle);
	}

	.qty {
		font-weight: 800;
		color: var(--color-accent);
		margin-left: 0.1rem;
	}

	.time-col {
		width: 80px;
		color: var(--color-muted);
		font-size: 0.75rem;
		text-align: right;
	}

	.empty-state {
		padding: 2.5rem 1rem !important;
		text-align: center;
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.name-cell {
			width: auto;
		}

		.time-col {
			display: none;
		}
	}
</style>
