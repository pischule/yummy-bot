<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	export let orderedItems: Item[];

	const dispatch = createEventDispatcher();
	const nonce = crypto.randomUUID();
	let name = localStorage.getItem('name') || '';

	const sendOrder = async () => {
		const order = { name, orderedItems } satisfies Order;
		try {
			const response = await fetch('/order', {
				method: 'POST',
				body: JSON.stringify(order),
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': nonce
				}
			});

			if (!response.ok) {
				alert(`Ошибка: ${response.status}`);
				return;
			}

			localStorage.setItem('name', name);
			dispatch('confirm');
		} catch (e) {
			console.error(e);
			alert(`Ошибка: ${e}`);
		}
	};

	const handleMainBtnClick = () => {
		sendOrder();
	};
</script>

<h2>Ваш заказ</h2>

<form on:submit|preventDefault={handleMainBtnClick}>
	<input placeholder='Имя' required autocomplete='name' minlength='3' bind:value={name} aria-label='Имя'>
	<ul>
		{#each orderedItems as item (item.name)}
			<li>
				<span>{item.name}</span>
				{#if item.qty > 1}
					<span class='qty'> x{item.qty}</span>
				{/if}
			</li>
		{/each}
	</ul>
	<Button primary block>Отправить</Button>
</form>

<style>
    li {
        list-style-type: none;
    }

    ul {
        padding-inline-start: 0;
    }

		.qty {
				font-weight: bold;
		}

    input {
        font-size: 1em;
        padding: 8px;
        border-radius: var(--border-radius);
        border: solid var(--color-fg) var(--border-width);
    }
</style>