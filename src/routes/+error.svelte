<script lang="ts">
	import { page } from '$app/state';

	const heading = $derived(page.error?.description ?? page.error?.message ?? 'Ошибка');
	const timestamp = new Date().toISOString();
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

	<time datetime={timestamp}>{timestamp}</time>
</main>

<style>
	main {
		max-width: min(65ch, 100% - 1rem);
		margin-inline: auto;
		padding: 1rem;
	}

	p,
	a,
	time {
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}

	time {
		display: block;
		margin-top: 1rem;
		font-size: 0.85rem;
		color: #666;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	}
</style>
