<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		onclose = () => {},
		children
	}: {
		open: boolean;
		onclose?: () => void;
		children: Snippet;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (open) {
			if (dialogEl && !dialogEl.open) dialogEl.showModal();
		} else {
			if (dialogEl && dialogEl.open) dialogEl.close();
		}
	});

	function handleNativeClose() {
		open = false;
		onclose();
	}
</script>

<dialog
	bind:this={dialogEl}
	onclose={handleNativeClose}
	onclick={(e) => {
		if (e.target === dialogEl) dialogEl?.close();
	}}
>
	{@render children()}
</dialog>

<style>
	dialog {
		background: var(--color-bg);
		border: 1px solid var(--color-subtle);
		border-radius: var(--border-radius);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		width: 400px;
		max-width: 90vw;
		padding: 20px;
	}

	dialog :global(a),
	dialog :global(code) {
		overflow-wrap: break-word;
	}

	@media (max-width: 480px) {
		dialog {
			padding: 16px;
			margin-top: 15vh;
		}
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(1px);
	}

	dialog :global(h3) {
		font-size: 1.25rem;
		font-weight: 700;
		margin-top: 0;
		margin-bottom: 1rem;
	}

	dialog :global(.field) {
		margin-bottom: 1rem;
	}

	dialog :global(.field:last-of-type) {
		margin-bottom: 0;
	}

	:global(.modal-footer) {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}
</style>
