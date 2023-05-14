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
				alert(`Bad response status: ${response.status}`);
				return;
			}

			localStorage.setItem('name', name);
			dispatch('confirm');
		} catch (e) {
			console.error(e);
			alert(`Something went wrong: ${e}`);
		}
	};

	const handleMainBtnClick = () => {
		sendOrder();
	};
</script>

<h2>Ваш заказ</h2>

<form on:submit|preventDefault={handleMainBtnClick}>
	<label>
		Имя:
		<input required autocomplete='name' minlength='3' bind:value={name}>
	</label>
	<ul>
		{#each orderedItems as item (item.name)}
			<li>{item.name} {item.qty > 1 ? `x${item.qty}` : ''}</li>
		{/each}
	</ul>
	<Button main fullwidth>Подтвердить</Button>
</form>

<style>
    li {
        list-style-type: none;
    }

    ul {
        padding-inline-start: 0;
    }

		input {
				font-size: 1em;
		}
</style>