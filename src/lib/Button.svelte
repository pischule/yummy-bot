<script lang="ts">
	let {
		children,
		primary = false,
		block = false,
		flex = false,
		formaction = undefined,
		disabled = false,
		sm = undefined,
		flat = false,
		type = 'button' as 'button' | 'submit' | 'reset',
		onclick = undefined as ((e: Event) => void) | undefined
	} = $props();
</script>

<button
	class:sm
	class:primary
	class:block
	class:flex
	class:flat
	{onclick}
	{disabled}
	{formaction}
	{type}
>
	{@render children()}
</button>

<style>
	button {
		padding: 14px;
		font-size: 1.125rem;
		background-color: var(--color-bg);
		border: solid var(--color-border) var(--border-width);
		border-radius: var(--border-radius);
		cursor: pointer;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;

		transition: 0.2s ease;
		box-shadow: 3px 3px 0 0 var(--color-border);
	}

	@media (hover: hover) and (pointer: fine) {
		button:not(.flat):hover:not(:disabled) {
			transform: translate(3px, 3px);
			box-shadow: none;
		}
		button.flat:hover:not(:disabled) {
			background-color: var(--color-hover-bg);
		}
		button.flat.primary:hover:not(:disabled) {
			background-color: var(--color-accent);
			filter: brightness(1.1);
		}
	}

	button:not(.flat):active:not(:disabled) {
		transform: translate(3px, 3px);
		box-shadow: none;
	}

	button.flat {
		box-shadow: none;
		border-width: 1px;
		border-color: var(--color-muted);
	}

	button.flat.primary {
		border-color: var(--color-accent);
	}

	button:disabled {
		box-shadow: none;
		opacity: 60%;
		cursor: not-allowed;
	}

	button.primary {
		background-color: var(--color-accent);
		color: var(--color-accent-text);
		font-weight: bold;
	}

	.sm {
		font-size: 1rem;
		padding: 6px 8px;
	}

	.block {
		width: 100%;
	}

	.flex {
		flex: 1;
	}
</style>
