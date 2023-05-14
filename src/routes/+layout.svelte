<main>
	<slot />
</main>

<style>
    :global(:root) {
        --color-bg: hsl(0, 0%, 100%);
				--color-fg: hsl(0, 0%, 0%);
        --color-border: hsl(0, 0%, 27%);

        --color-accent: hsl(241, 100%, 66%);
        --color-accent-text: hsl(0, 0%, 100%);

				--border-width: 2px;
				--border-radius: 10px;
    }

    @media (prefers-color-scheme: dark) {
        :global(:root) {
            --color-bg: hsl(0, 0%, 10%);
            --color-fg: hsl(0, 0%, 100%);
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

		main {
        max-width: min(65ch, 100% - 1rem);
				margin-inline: auto;
				padding-block-end: 8px;
		}

		:global(h2) {
				font-size: 1.6rem;
		}
</style>