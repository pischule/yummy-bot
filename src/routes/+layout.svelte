<slot />

<style>
    :global(:root) {
        --fg: #444;
        /*--bg: #f5f5f5;*/
        --bg: #ffff;
				--accent: hsl(328, 100%, 54%);
				--accent-pressed: hsl(328, 100%, 45%);
    }

    :global(body) {
        font-size: 16px;
        font-family: sans-serif;
        max-width: 650px;
        margin: 20px auto;
        padding: 0 10px;
        color: var(--fg);
        background-color: var(--bg);
    }

		:global(h1, h2, h3) {
        line-height: 1.2;
		}

</style>