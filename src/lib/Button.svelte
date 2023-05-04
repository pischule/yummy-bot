<script lang='ts'>
	export let main = false;
	export let fullwidth = false;
	export let flex = false;

	export let disabled = false;
</script>

<button class:main class:fullwidth class:flex on:click {disabled}>
	<slot />
</button>

<style>
    button {
        background-color: var(--bg);
        border: solid var(--fg) 1px;
        box-shadow: 2px 2px var(--fg);
    }

    button:active {
        transform: translate(2px, 2px);
        box-shadow: none;
    }

    .main {
        background-color: var(--accent);
        box-shadow: 2px 2px var(--fg);
        color: var(--bg);
        font-weight: bold;
				border: none;
    }

    .main:active {
        background-color: var(--accent-pressed);
    }

    .fullwidth {
        height: 2rem;
        width: 100%;
    }

    .flex {
        flex-grow: 1;
    }
</style>