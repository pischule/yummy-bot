<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
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
			dialogEl?.showModal();
		} else {
			dialogEl?.close();
		}
	});
</script>

<dialog
	bind:this={dialogEl}
	onclose={onclose}
	onclick={(e) => {
		if (e.target === dialogEl) dialogEl?.close();
	}}
>
	{@render children()}
</dialog>

<style>
	dialog {
		background: var(--color-bg);
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
		width: 420px;
		max-width: 90vw;
		padding: 24px;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(2px);
	}

	dialog :global(h3) {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 18px;
	}

	dialog :global(.field) {
		margin-bottom: 14px;
	}

	dialog :global(.field:last-of-type) {
		margin-bottom: 0;
	}

	:global(.btn-cancel) {
		font-size: 1rem;
		padding: 6px 8px;
		background: var(--color-bg);
		border: solid var(--color-border) var(--border-width);
		border-radius: var(--border-radius);
		cursor: pointer;
		font-family: inherit;
		box-shadow: 3px 3px 0 0 var(--color-border);
		transition: 0.2s ease;
	}
	:global(.btn-cancel:hover) {
		transform: translate(3px, 3px);
		box-shadow: none;
	}
	:global(.btn-cancel:active) {
		transform: translate(3px, 3px);
		box-shadow: none;
	}

	:global(.modal-footer) {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 20px;
	}
</style>
