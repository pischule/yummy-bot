<script>
	import '$lib/assets/global.css';

	let { children } = $props();
</script>

<main>
	{@render children?.()}
</main>

<style>
	main {
		max-width: min(65ch, 100% - 1rem);
		margin-inline: auto;
		padding-block-end: 8px;
	}
</style>
