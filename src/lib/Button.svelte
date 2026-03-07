<script lang="ts">
	let {
		children,
		primary = false,
		block = false,
		flex = false,
		formaction = undefined,
		disabled = false,
		sm = undefined,
		onclick = () => {}
	} = $props();
</script>

<button class:sm class:primary class:block class:flex {onclick} {disabled} {formaction}>
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

		transition: 0.2s ease;
		box-shadow: 3px 3px 0 0 var(--color-border);
	}

	@media (hover: hover) {
		button:hover {
			transform: translate(3px, 3px);
			box-shadow: none;
		}
	}

	button:active {
		transform: translate(3px, 3px);
		box-shadow: none;
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
		flex-grow: 1;
	}
</style>
