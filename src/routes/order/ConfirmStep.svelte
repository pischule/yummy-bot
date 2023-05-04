<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	export let orderedItems;

	const dispatch = createEventDispatcher();

	const nonce = crypto.randomUUID();
	let name = '';

	const sendOrder = async () => {
		try {
			const response = await fetch('/order', {
				method: 'POST',
				body: JSON.stringify({
					nonce,
					name,
					items: orderedItems
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`bad response status: ${response.status}`);
			}

			dispatch('confirm');
		} catch (e) {
			console.error(e);
			alert('Something went wrong, try again');
		}
	};

	const handleMainBtnClick = () => {
		sendOrder();
	};
</script>

<h2>Ваш заказ</h2>

<form>
	<label>
		Имя:
		<input required autocomplete='name' minlength='3' bind:value={name}>
	</label>

	<ul>
		{#each orderedItems as item (item.name)}
			<li>{item.name} {item.qty > 1 ? `x${item.qty}` : ''}</li>
		{/each}
	</ul>
	<Button main fullwidth on:click={handleMainBtnClick}>Подтвердить</Button>
</form>
<style>
    li {
        list-style-type: none;
    }

    ul {
        padding-inline-start: 0;
    }
</style>