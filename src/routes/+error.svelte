<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status}</title>
</svelte:head>

<main>
	<h1>{page.status} {page.error?.message ?? ''}</h1>
	{#if page.status === 401}
		<p>Не получается войти? Попробуйте мини-апп</p>
	{/if}
</main>

<style>
	main {
		max-width: min(65ch, 100% - 1rem);
		margin-inline: auto;
		padding: 1rem;
	}

	h1 {
		font-family: system-ui, sans-serif;
		font-size: 1.25rem;
	}

	p {
		font-family: system-ui, sans-serif;
		line-height: 1.5;
	}
</style>
