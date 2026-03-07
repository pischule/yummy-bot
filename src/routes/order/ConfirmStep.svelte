<script lang="ts">
	import Button from '$lib/Button.svelte';

	interface Props {
		items: Item[];
		nameFromServer: string | undefined;
		onConfirm: () => void;
	}

	let { items, nameFromServer, onConfirm }: Props = $props();

	let orderedItems = items.filter((item: Item) => item.qty > 0);

	const nonce = crypto.randomUUID();
	let sending = $state(false);
	let name = $state(nameFromServer ?? localStorage.getItem('name') ?? '');

	const sendOrder = async () => {
		const order = { name, orderedItems } satisfies Order;
		try {
			sending = true;
			const response = await fetch(`/order${window.location.search}`, {
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
			onConfirm();
		} catch (e) {
			console.error(e);
			alert(`Ошибка: ${e}`);
		} finally {
			sending = false;
		}
	};

	const handleMainBtnClick = (event: Event) => {
		event.preventDefault();
		sendOrder();
	};
</script>

<h1>Ваш заказ</h1>

<form onsubmit={handleMainBtnClick}>
	<input
		placeholder="Ваше имя"
		required
		autocomplete="name"
		minlength="3"
		bind:value={name}
		aria-label="Имя"
	/>
	<ul>
		{#each orderedItems as item (item.name)}
			<li>
				<span>{item.name}</span>
				{#if item.qty > 1}
					<span class="qty"> x{item.qty}</span>
				{/if}
			</li>
		{/each}
	</ul>
	<Button primary block disabled={sending}>{sending ? 'Отправляю...' : 'Отправить'}</Button>
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
