<script lang="ts">
	import Button from '$lib/Button.svelte';

	interface Props {
		items: Item[];
		weekday: string;
		onChoose: (items: Item[]) => void;
		onUpdateItemQty: (item: Item, increment: number) => void;
	}

	let { items, weekday, onUpdateItemQty, onChoose }: Props = $props();

	const selectedItems = $derived(items.filter((item) => item.qty > 0));
</script>

<h1>Меню на {weekday}</h1>

<div class="items-container">
	{#each items as item}
		<div class="item">
			<span class="item-title">{item.name}</span>

			<span class="item-qty-indicator">{item.qty || ''}</span>
			<div class="item-qty-buttons">
				{#if item.qty > 0}
					<Button flex sm onclick={() => onUpdateItemQty(item, -1)}>-</Button>
				{/if}
				<Button flex sm onclick={() => onUpdateItemQty(item, 1)}
					>{item.qty === 0 ? 'Добавить' : '+'}</Button
				>
			</div>
		</div>
	{/each}
</div>

<Button primary block disabled={selectedItems.length === 0} onclick={onChoose}>Далее</Button>

<style>
	.item {
		display: flex;
		padding-block: 0.4em;
		align-items: baseline;
	}

	.item:not(:last-child) {
		border-bottom: solid var(--border-width) var(--color-border);
	}

	.item-title {
		flex-grow: 1;
		display: block;
		align-content: center;
	}

	.items-container {
		margin-bottom: 10px;
	}

	.item-qty-buttons {
		display: flex;
		min-width: 11ch;
		justify-content: space-between;
		gap: 4px;
		flex-shrink: 0;
	}

	.item-qty-indicator {
		min-width: 1ch;
		padding-inline: 8px;
		font-weight: bold;
		text-align: end;
	}
</style>
