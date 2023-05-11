<slot />

<style>
    :global(:root) {
        --fg: #000000;
        --bg: #ffff;
				--border: #464646;

				--accent: hsl(328, 100%, 54%);
				--accent-text: #ffff;
    }

		@media(prefers-color-scheme: dark) {
        :global(:root) {
            --fg: #d9d9d9;
            --bg: #121212;
            --border: #626262;
        }

				:global(textarea, input) {
						background-color: #333333;
						color: var(--fg);
				}
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