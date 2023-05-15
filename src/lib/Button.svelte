<script lang='ts'>
	export let primary = false;
	export let block = false;
	export let flex = false;
	export let formaction = undefined;
	export let sm = false;

	export let disabled = false;
</script>

<button class:primary class:block class:flex on:click class:sm {disabled} {formaction}>
	<slot />
</button>

<style>
    button {
        padding: 14px;
        font-size: 1.125rem;
        background-color: var(--color-bg);
        border: solid var(--color-border) var(--border-width);
        border-radius: var(--border-radius);

        transition: .2s ease;
        box-shadow: 3px 3px 0 0 var(--color-border);
    }

    @media (hover: hover) {
        button:hover:not(:disabled) {
            transform: translate(3px, 3px);
            box-shadow: none;
        }
    }

    button.primary {
        background-color: var(--color-accent);
        color: var(--color-accent-text);
        font-weight: bold;
    }

    button:disabled {
        opacity: 60%;
        cursor: not-allowed;
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