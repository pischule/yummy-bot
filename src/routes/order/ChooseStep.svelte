<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	export let items;

	const dispatch = createEventDispatcher();

	$: orderedItems = items.filter(item => item.qty > 0);

	const updateItemQty = (updatedItem, increment) => {
		updatedItem.qty = Math.max(updatedItem.qty + increment, 0);
		items = items;
	};

	const handleMainBtnClick = () => {
		dispatch('choose', { items: [...orderedItems] });
	};
</script>

<h2>Меню на вторник</h2>

<div class='items-container'>
	{#each items as item (item.name)}
		<div class='item'>
			<span class='item-title'>{ item.name }</span>

			{#if item.qty > 0}
				<span class='item-qty-indicator'>{item.qty}</span>
			{/if}
			<div class='item-qty-buttons'>
				{#if item.qty === 0}
					<Button flex on:click={() => updateItemQty(item, 1)}>Добавить</Button>
				{:else }
					<Button flex on:click={() => updateItemQty(item, -1)}>-</Button>
					<Button flex on:click={() => updateItemQty(item, 1)}>+</Button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<Button main fullwidth disabled={orderedItems.length === 0} on:click={handleMainBtnClick}>Далее</Button>


<style>
    .item {
        display: flex;
        padding-block: 0.4em;
    }

    .item:not(:last-child) {
        border-bottom: solid 1px;
    }

    .item-title {
        flex-grow: 1;
    }

    .items-container {
        margin-bottom: 10px;
    }

    .item-qty-buttons {
        display: flex;
        width: 5.2rem;
        height: 1.6rem;
        justify-content: space-between;
        gap: 4px;
        flex-shrink: 0;
    }

    .item-qty-indicator {
        padding-inline: 6px;
        font-weight: bold;
    }
</style>
