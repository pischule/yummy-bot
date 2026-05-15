<script lang="ts">
	interface LocationItem {
		id: string;
		name: string;
		menuStatus: string;
	}

	let {
		locations,
		activeLocationId = null as string | null,
		countingMissing = 0,
		open = false,
		ontoggle = () => {},
		onadd = () => {},
		onedit = (id: string) => {},
		ondelete = (id: string) => {}
	}: {
		locations: LocationItem[];
		activeLocationId?: string | null;
		countingMissing?: number;
		open?: boolean;
		ontoggle?: () => void;
		onadd?: () => void;
		onedit?: (id: string) => void;
		ondelete?: (id: string) => void;
	} = $props();
</script>

{#if open}
	<div class="backdrop" onclick={ontoggle} role="presentation"></div>
{/if}
<aside class="sidebar" class:open>
	<div class="sidebar-header">
		<div class="heading-group">
			<a href="?" data-sveltekit-preload-data="off" class="heading-link"><h2>Локации</h2></a>
			{#if countingMissing > 0}
				<span class="badge badge-warn" title="Локаций без меню">{countingMissing}</span>
			{/if}
		</div>
		<button class="btn-add" onclick={onadd}>+ Добавить</button>
	</div>
	<div class="sidebar-list">
		{#if locations.length === 0}
			<div class="empty-state">
				<span class="emoji">☕</span>
				Нет добавленных локаций.<br />Нажмите «Добавить», чтобы начать.
			</div>
		{:else}
			{#each locations as loc (loc.id)}
				<a
					class="location-item"
					class:active={loc.id === activeLocationId}
					href="?locationId={loc.id}"
					data-sveltekit-preload-data="off"
					onclick={ontoggle}
				>
					<div class="icon">📍</div>
					<div class="info">
						<div class="name">{loc.name}</div>
					</div>
					<span
						class="status-dot-wrap"
						title={loc.menuStatus === 'set' ? 'Меню обновлено сегодня' : 'Меню не задано'}
					>
						<span class="status-dot {loc.menuStatus === 'set' ? 'dot-set' : 'dot-empty'}"></span>
					</span>
					<div class="actions" onclick={(e) => e.preventDefault()} role="presentation">
						<button class="btn-icon" title="Редактировать" onclick={() => onedit(loc.id)}>
							✎
						</button>
						<button class="btn-icon danger" title="Удалить" onclick={() => ondelete(loc.id)}>
							✕
						</button>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		width: 280px;
		min-width: 280px;
		background: var(--color-bg);
		border-right: solid var(--color-fg) var(--border-width);
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		padding: 20px 16px 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sidebar-header h2 {
		font-size: 15px;
		font-weight: 600;
	}

	.heading-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.heading-link {
		text-decoration: none;
		color: inherit;
	}

	.btn-add {
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		padding: 6px 12px;
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		background: var(--color-bg);
		cursor: pointer;
		white-space: nowrap;
		box-shadow: 2px 2px 0 0 var(--color-fg);
		transition: 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}
	@media (hover: hover) and (pointer: fine) {
		.btn-add:hover {
			transform: translate(1px, 1px);
			box-shadow: 1px 1px 0 0 var(--color-fg);
		}
	}
	.btn-add:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}

	.sidebar-list {
		flex: 1;
		overflow-y: auto;
		padding: 4px 8px;
	}

	/* ===== BADGE ===== */
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		line-height: 1;
	}
	.badge-warn {
		background: var(--color-warning-bg);
		color: var(--color-warning);
		border: 1px solid var(--color-warning-border);
	}

	/* ===== LOCATION ITEM ===== */
	.location-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		margin-bottom: 2px;
		position: relative;
		-webkit-tap-highlight-color: transparent;
	}
	@media (hover: hover) and (pointer: fine) {
		.location-item:hover {
			background: var(--color-hover-bg);
		}
	}
	.location-item.active {
		background: hsl(241 100% 66% / 0.08);
	}

	.location-item .icon {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: var(--color-surface-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 15px;
		flex-shrink: 0;
	}

	.location-item .info {
		flex: 1;
		min-width: 0;
	}
	.location-item .name {
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.location-item .actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.15s;
	}
	@media (hover: hover) and (pointer: fine) {
		.location-item:hover .actions {
			opacity: 1;
		}
	}
	.location-item.active .actions {
		opacity: 1;
	}

	/* ===== STATUS DOT ===== */
	.status-dot-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.dot-set {
		background: var(--color-success);
	}
	.dot-empty {
		background: var(--color-muted);
	}

	/* ===== BUTTON ICON ===== */
	.btn-icon {
		width: 28px;
		height: 28px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: transparent;
		border: none;
		color: inherit;
		opacity: 0.5;
		cursor: pointer;
		font-size: 13px;
		font-family: inherit;
		-webkit-tap-highlight-color: transparent;
	}
	@media (hover: hover) and (pointer: fine) {
		.btn-icon:hover {
			background: var(--color-surface-bg);
			opacity: 1;
		}
		.btn-icon.danger:hover {
			background: var(--color-danger-bg);
			color: var(--color-danger);
		}
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		opacity: 0.5;
		font-size: 13px;
		line-height: 1.5;
	}
	.empty-state .emoji {
		font-size: 32px;
		margin-bottom: 8px;
		display: block;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 98;
		-webkit-tap-highlight-color: transparent;
	}

	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			width: 280px;
			height: 100vh;
			max-height: none;
			z-index: 99;
			transform: translateX(-100%);
			transition: transform 0.25s ease;
			border-right: solid var(--color-fg) var(--border-width);
			border-bottom: none;
		}
		.sidebar.open {
			transform: translateX(0);
		}
	}
</style>
