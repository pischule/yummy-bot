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

        transition: 100ms linear;
    }

    button:active {
        transform: translate(0px, 2px);
    }

    button.primary {
        background-color: var(--color-accent);
        color: var(--color-accent-text);
        border: none;
        font-weight: bold;
    }

    button:disabled {
        opacity: 60%;
        transform: translate(0px, 2px);
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