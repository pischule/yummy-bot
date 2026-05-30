<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let url = $derived(page.url);

	let selectedLocationId = $derived(
		url.searchParams.get('locationId') ?? data.locations[0]?.id ?? null
	);

	let isLocationsPage = $derived(url.pathname.endsWith('/locations'));

	function locationHref(locId: string) {
		const path = url.pathname;
		const pageName = path.endsWith('/orders') ? 'orders' : 'menu';
		const params = new URLSearchParams();
		params.set('locationId', locId);
		const date = url.searchParams.get('date');
		if (date) params.set('date', date);
		return `${pageName}?${params.toString()}`;
	}

	const icons = {
		mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
		settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`
	};
</script>

<div class="layout" class:layout--single={isLocationsPage}>
	<header>
		<div class="header-content">
			<h1>YummyBot <span>Admin</span></h1>
			<nav id="view-nav">
				<a
					href="./menu?locationId={selectedLocationId}"
					class:active={url.pathname.endsWith('/menu')}
				>
					Меню
				</a>
				<a
					href="./orders?locationId={selectedLocationId}"
					class:active={url.pathname.endsWith('/orders')}
				>
					Заказы
				</a>
				<a
					href="/_/parser"
					class:active={url.pathname.startsWith('/_/parser')}
				>
					Парсер
				</a>
			</nav>
		</div>
	</header>

	{#if !isLocationsPage}
		<aside>
			<div class="sidebar-header">
				<span class="icon-inline">{@html icons.mapPin}</span>
				Локации
			</div>
			<ul id="sidebar-list">
				{#each data.locations as loc (loc.id)}
					<li>
						<a
							href={locationHref(loc.id)}
							class:selected={loc.id === selectedLocationId}
							class:has-menu={loc.isPosted}
						>
							<span class="status-dot"></span>
							<span class="loc-name">{loc.name}</span>
						</a>
					</li>
				{/each}
			</ul>
			<div class="sidebar-footer">
				<a href="./locations" class="settings-link">
					<span class="icon-inline">{@html icons.settings}</span>
					Управление локациями
				</a>
			</div>
		</aside>
	{/if}

	<main>
		{@render children()}
	</main>
</div>

<style>
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
	.layout {
		font-family: system-ui, sans-serif;
		margin: 0;
		display: grid;
		grid-template: auto 1fr / 260px 1fr;
		height: 100vh;
		background: var(--color-bg);
		overflow: hidden;
	}
	header {
		grid-column: 1 / -1;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-subtle);
		padding: 0.6rem 1.5rem;
		z-index: 10;
	}
	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin: 0 auto;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	header h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.01em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	header h1 span {
		color: var(--color-accent);
		font-weight: 400;
		margin-left: 0.1rem;
	}
	header nav {
		display: flex;
		gap: 0.5rem;
	}
	header nav a {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		padding: 0.35rem 0.8rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		text-decoration: none;
		color: inherit;
		border-radius: 4px;
		transition: all 0.2s;
	}
	header nav a:hover {
		background: var(--color-hover-bg);
	}
	header nav a.active {
		background: var(--color-accent);
		color: var(--color-accent-text);
		border-color: var(--color-accent);
	}
	aside {
		border-right: 1px solid var(--color-subtle);
		padding: 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: var(--color-surface-bg);
		height: 100%;
	}
	.sidebar-header {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 0.5rem;
		flex-shrink: 0;
	}
	aside ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		overflow-y: auto;
		flex: 1;
	}
	aside ul a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		text-decoration: none;
		color: inherit;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.1s;
	}
	aside ul a:hover {
		background: var(--color-hover-bg);
	}
	aside ul a.selected {
		background: var(--color-bg);
		font-weight: 700;
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #9ca3af;
		flex-shrink: 0;
	}
	a.has-menu .status-dot {
		background: var(--color-success);
	}
	.sidebar-footer {
		margin-top: auto;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-subtle);
		flex-shrink: 0;
	}
	.settings-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		font-size: 0.8rem;
		text-decoration: none;
		color: var(--color-muted);
		border-radius: 6px;
		transition: all 0.2s;
	}
	.settings-link:hover {
		color: var(--color-fg);
		background: var(--color-hover-bg);
	}
	.icon-inline {
		display: inline-flex;
		vertical-align: middle;
	}
	main {
		padding: 1.5rem;
		overflow-y: auto;
		width: 100%;
	}
	.layout--single {
		grid-template: auto 1fr / 1fr;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template: auto auto 1fr / 1fr;
			height: auto;
			overflow: visible;
		}
		header {
			padding: 0.5rem 1rem;
		}
		header h1 {
			font-size: 1.1rem;
		}
		header nav a {
			padding: 0.25rem 0.6rem;
			font-size: 0.8rem;
		}
		aside {
			border-right: none;
			border-bottom: 1px solid var(--color-subtle);
			padding: 0.4rem 0.5rem;
			height: auto;
			overflow-y: visible;
			gap: 0.5rem;
		}
		.sidebar-header {
			display: none;
		}
		aside ul {
			flex-direction: row;
			overflow-x: auto;
			padding-bottom: 0;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}
		aside ul::-webkit-scrollbar {
			display: none;
		}
		aside ul a {
			white-space: nowrap;
			padding: 0.35rem 0.6rem;
			font-size: 0.875rem;
		}
		.sidebar-footer {
			margin-top: 0;
			padding-top: 0;
			border-top: none;
			border-left: 1px solid var(--color-subtle);
			padding-left: 0.5rem;
			display: flex;
			align-items: center;
		}
		.settings-link {
			padding: 0.35rem;
		}
		.settings-link span:last-child {
			display: none;
		}
		main {
			padding: 1rem;
			overflow-y: visible;
			height: auto;
		}
	}
</style>
