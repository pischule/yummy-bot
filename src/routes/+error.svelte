<script lang="ts">
	import { page } from '$app/state';

	const heading = $derived(page.error?.description ?? page.error?.message ?? 'Ошибка');
	const helpUrl = $derived(
		page.status === 401 &&
			page.error?.showLoginHelp === true &&
			page.error?.botUsername != null &&
			page.error?.linkId != null
			? `https://t.me/${page.error.botUsername}/?start=${page.error.linkId}`
			: null
	);
</script>

<svelte:head>
	<title>Ошибка</title>
</svelte:head>

<main>
	{#if helpUrl == null}
		<p>{heading}</p>
	{/if}

	{#if helpUrl != null}
		<p>
			Упс, магия не сработала —
			<a href={helpUrl}>попробуем другой способ</a>
			прямо в приложении
		</p>
	{/if}
</main>

<style>
	main {
		max-width: min(65ch, 100% - 1rem);
		margin-inline: auto;
		padding: 1rem;
	}

	p,
	a {
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}
</style>
