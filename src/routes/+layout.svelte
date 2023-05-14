<div class='container'>
	<slot />
</div>

<style>
    :global(:root) {
        --color-bg: hsl(0, 0%, 100%);
        --color-border: hsl(0, 0%, 27%);

        --color-accent: hsl(328, 100%, 54%);
        --color-accent-text: hsl(0, 0%, 100%);
    }

    @media (prefers-color-scheme: dark) {
        :global(:root) {
            --color-bg: hsl(0, 0%, 10%);
        }
    }

    :global(html) {
        color-scheme: light dark;
    }

    :global(body) {
        font-size: 1rem;
        font-family: system-ui;
        line-height: 1.5;

				background-color: var(--color-bg);
    }

		.container {
        max-width: min(65ch, 100% - 1rem);
				margin-inline: auto;
		}
</style>