<script lang='ts'>
	export let main = false;
	export let fullwidth = false;
	export let flex = false;
	export let formaction = undefined;

	export let disabled = false;
</script>

<button class:main class:fullwidth class:flex on:click {disabled} {formaction}>
	<slot />
</button>

<style>
    button {
        background-color: var(--bg);
        color: var(--fg);
        border: solid var(--border) 1px;
        box-shadow: 2px 2px var(--border);
    }

    button:active {
        transform: translate(2px, 2px);
        box-shadow: none;
    }

    button.main {
        background-color: var(--accent);
        color: var(--accent-text);
        border: var(--accent);
        font-weight: bold;
    }

		button:disabled {
				opacity: 60%;
				box-shadow: none;
        transform: translate(2px, 2px);
		}

    .main:active {
        box-shadow: none;
    }

    .fullwidth {
        height: 2rem;
        width: 100%;
    }

    .flex {
        flex-grow: 1;
    }
</style>