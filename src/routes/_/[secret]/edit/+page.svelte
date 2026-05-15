<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/Button.svelte';
	import Dialog from '$lib/Dialog.svelte';
	import Sidebar from '$lib/Sidebar.svelte';

	const { data }: PageProps = $props();

	let toasts = $state<{ message: string; type: string }[]>([]);
	let modal = $state<'add' | 'edit' | 'delete' | null>(null);
	let modalTargetId = $state('');
	let modalError = $state('');
	let formError = $state('');

	let sidebarOpen = $state(false);
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	let activeLocationId = $derived(data.activeLocationId);

	$effect(() => {
		if (activeLocationId) sidebarOpen = false;
	});

	let locations = $derived(data.locations ?? []);
	let activeLocation = $derived(data.activeLocation);
	let menuText = $state(data.menuItems?.join('\n') ?? '');

	$effect(() => {
		menuText = data.menuItems?.join('\n') ?? '';
	});
	let receiptDate = $derived(data.receiptDate ?? '');
	let botUsername = $derived(data.botUsername ?? '');

	let countingMissing = $derived(locations.filter((l) => l.menuStatus !== 'set').length);
	let allSet = $derived(locations.length > 0 && countingMissing === 0);

	function showToast(message: string, type = '') {
		toasts.push({ message, type });
		setTimeout(() => {
			toasts = toasts.filter((t) => t.message !== message);
		}, 2500);
	}

	function openModal(type: 'add' | 'edit' | 'delete', targetId?: string) {
		modal = type;
		modalTargetId = targetId ?? '';
		modalError = '';
	}

	function closeModal() {
		modal = null;
		modalTargetId = '';
		modalError = '';
	}

	function onFormResult(result: any, update: () => void) {
		if (result.type === 'success' && result.data?.success === false) {
			modalError = result.data.error;
		} else {
			closeModal();
			update();
		}
	}
</script>

<svelte:head>
	<title>Yummy Bot — Управление меню</title>
</svelte:head>

<div class="app-shell">
	<Sidebar
		{locations}
		{activeLocationId}
		{countingMissing}
		open={sidebarOpen}
		ontoggle={toggleSidebar}
		onadd={() => openModal('add')}
		onedit={(id) => openModal('edit', id)}
		ondelete={(id) => openModal('delete', id)}
	/>

	<!-- ===== MAIN ===== -->
	<main class="main-area">
		{#if activeLocationId && activeLocation}
			<div class="main-header">
				<div class="header-top">
					<button class="menu-toggle" onclick={toggleSidebar} aria-label="Открыть список локаций"
						>☰</button
					>
					<h1>{activeLocation.name}</h1>
				</div>
			</div>
			<div class="main-body">
				{#if countingMissing > 0}
					{@const missingLocations = locations.filter(
						(l) => l.id !== activeLocationId && l.menuStatus !== 'set'
					)}
					{#if missingLocations.length > 0}
						<div class="warning-banner">
							<span class="warn-icon">⚠</span>
							<span class="warn-text">
								<strong>Внимание:</strong> у {missingLocations.length}
								{missingLocations.length === 1 ? 'локации' : 'локаций'}
								не задано меню:
								{missingLocations.map((l) => l.name).join(', ')}.
								<a href="?locationId={missingLocations[0].id}" data-sveltekit-preload-data="off">
									Перейти
								</a>
							</span>
						</div>
					{/if}
				{/if}

				<form
					method="POST"
					action="?/save"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success' && result.data?.success === false) {
								formError = result.data.error as string;
							} else {
								formError = '';
								await update();
							}
						};
					}}
				>
					<input type="hidden" name="locationId" value={activeLocation.id} />

					<div class="form-section">
						<label class="field-label" for="items">Меню</label>
						<textarea
							id="items"
							name="items"
							class="textarea"
							placeholder="Вставьте список блюд..."
							bind:value={menuText}
						></textarea>
						<p class="hint">По одному блюду на строку. Например: «Борщ»</p>
					</div>

					<div class="form-section">
						<label class="field-label" for="receiptDate">Дата доставки</label>
						<input
							id="receiptDate"
							name="receiptDate"
							type="date"
							class="date-input"
							value={receiptDate}
						/>
					</div>

					{#if formError}
						<p class="error-text form-error">{formError}</p>
					{/if}
					<div class="action-bar">
						<Button formaction="?/save" block flex>Сохранить меню</Button>
						<Button
							formaction="?/saveAndSend"
							primary
							block
							flex
							disabled={menuText.trim().length === 0}
						>
							Сохранить и отправить
						</Button>
					</div>
				</form>
			</div>
		{:else}
			<div class="main-header">
				<div class="header-top">
					<button class="menu-toggle" onclick={toggleSidebar} aria-label="Открыть список локаций"
						>☰</button
					>
					<h1>Обзор локаций</h1>
				</div>
				<div class="subtitle">Статус меню по всем кафе</div>
			</div>
			<div class="main-body">
				{#if locations.length === 0}
					<div class="empty-state">
						<span class="emoji">☕</span>
						Добавьте первую локацию через кнопку<br />«Добавить» в боковой панели.
					</div>
				{:else}
					{#if allSet}
						<div class="banner banner-ok">
							<span class="warn-icon">✓</span>
							<span class="warn-text"
								><strong>Всё готово!</strong> Меню задано для всех локаций.</span
							>
						</div>
					{:else}
						<div class="warning-banner">
							<span class="warn-icon">⚠</span>
							<span class="warn-text">
								<strong>{countingMissing} из {locations.length} локаций</strong> без меню. Нажмите на
								карточку, чтобы заполнить меню.
							</span>
						</div>
					{/if}

					<div class="dashboard-grid">
						{#each locations as loc (loc.id)}
							<a class="dash-card" href="?locationId={loc.id}" data-sveltekit-preload-data="off">
								<div class="card-header">
									<div class="card-icon">📍</div>
									<div class="card-title">{loc.name}</div>
								</div>
								<div
									class="card-status"
									class:menu-set={loc.menuStatus === 'set'}
									class:menu-missing={loc.menuStatus !== 'set'}
								>
									{loc.menuStatus === 'set' ? '✓ Меню задано' : '✕ Меню не задано'}
									{#if loc.menuStatus === 'set' && loc.receiptDate}
										· {loc.receiptDate}
									{/if}
								</div>
								{#if loc.menuStatus === 'set' && loc.menu.length > 0}
									<div class="card-preview">
										{loc.menu.slice(0, 3).join('\n')}
									</div>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>

<!-- ===== TOASTS ===== -->
{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as t (t.message)}
			<div class="toast {t.type}">{t.message}</div>
		{/each}
	</div>
{/if}

<Dialog open={modal !== null} onclose={closeModal}>
	{#if modal === 'add'}
		<h3>Новая локация</h3>
		<form
			method="POST"
			action="?/addLocation"
			use:enhance={() => {
				return async ({ result, update }) => {
					onFormResult(result, update);
				};
			}}
		>
			<div class="field">
				<label class="field-label" for="modalName">Название</label>
				<input
					class="input"
					id="modalName"
					name="name"
					placeholder="например, Кафе на Ленина"
					maxlength="60"
				/>
			</div>
			<div class="field">
				<label class="field-label" for="modalChatId">Chat ID</label>
				<input
					class="input"
					id="modalChatId"
					name="chatId"
					placeholder="например, -1001234567890"
					maxlength="30"
				/>
				<p class="hint">
					Добавьте <a href="https://t.me/{botUsername}" target="_blank">@{botUsername}</a> в чат и
					вызовите команду <code>/chatid</code>. Вставьте полученный ID сюда.
				</p>
			</div>
			{#if modalError}
				<p class="error-text">{modalError}</p>
			{/if}
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick={() => closeModal()}>Отмена</button>
				<Button primary sm>Добавить</Button>
			</div>
		</form>
	{:else if modal === 'edit' && modalTargetId}
		<h3>Редактировать локацию</h3>
		<form
			method="POST"
			action="?/editLocation"
			use:enhance={() => {
				return async ({ result, update }) => {
					onFormResult(result, update);
				};
			}}
		>
			<input type="hidden" name="id" value={modalTargetId} />
			<div class="field">
				<label class="field-label" for="modalName">Название</label>
				<input
					class="input"
					id="modalName"
					name="name"
					value={locations.find((l) => l.id === modalTargetId)?.name ?? ''}
					maxlength="60"
				/>
			</div>
			<div class="field">
				<label class="field-label" for="modalChatId">Chat ID</label>
				<input
					class="input"
					id="modalChatId"
					name="chatId"
					value={locations.find((l) => l.id === modalTargetId)?.chatId ?? ''}
					maxlength="30"
				/>
				<p class="hint">
					Добавьте <a href="https://t.me/{botUsername}" target="_blank">@{botUsername}</a> в чат и
					вызовите команду <code>/chatid</code>. Вставьте полученный ID сюда.
				</p>
			</div>
			{#if modalError}
				<p class="error-text">{modalError}</p>
			{/if}
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick={() => closeModal()}>Отмена</button>
				<Button primary sm>Сохранить</Button>
			</div>
		</form>
	{:else if modal === 'delete' && modalTargetId}
		<h3>Удалить локацию?</h3>
		<p class="confirm-text">
			Вы уверены, что хотите удалить <strong
				>{locations.find((l) => l.id === modalTargetId)?.name ?? ''}</strong
			>? Все данные меню будут потеряны.
		</p>
		<form
			method="POST"
			action="?/deleteLocation"
			use:enhance={() => {
				return async ({ result, update }) => {
					onFormResult(result, update);
				};
			}}
		>
			<input type="hidden" name="id" value={modalTargetId} />
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick={() => closeModal()}>Отмена</button>
				<Button primary sm>Удалить</Button>
			</div>
		</form>
	{/if}
</Dialog>

<style>
	/* ===== RESET & LAYOUT ===== */
	:global(main) {
		max-width: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}

	.app-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
		font-size: 14px;
	}

	/* ===== MAIN AREA ===== */
	.main-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.main-header {
		padding: 20px 24px 0;
		flex-shrink: 0;
	}

	.main-header h1 {
		font-size: 20px;
		font-weight: 600;
	}

	.subtitle {
		font-size: 13px;
		opacity: 0.6;
		margin-top: 2px;
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.header-top h1 {
		margin: 0;
	}
	.menu-toggle {
		display: none;
		background: none;
		border: none;
		font-size: 22px;
		cursor: pointer;
		padding: 2px 4px;
		color: var(--color-fg);
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		flex-shrink: 0;
		line-height: 1;
	}
	@media (max-width: 768px) {
		.menu-toggle {
			display: block;
		}
	}

	.main-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	/* ===== DASHBOARD ===== */
	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 14px;
	}

	.dash-card {
		display: block;
		background: var(--color-bg);
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		padding: 18px;
		text-decoration: none;
		color: inherit;
		box-shadow: 3px 3px 0 0 var(--color-fg);
		transition: 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}
	@media (hover: hover) and (pointer: fine) {
		.dash-card:hover {
			transform: translate(2px, 2px);
			box-shadow: 1px 1px 0 0 var(--color-fg);
		}
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	.card-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: var(--color-surface-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
	}
	.card-title {
		font-size: 14px;
		font-weight: 600;
	}
	.card-status {
		font-size: 11px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 500;
		padding: 5px 8px;
		border-radius: 6px;
	}
	.menu-set {
		background: var(--color-success-bg);
		color: var(--color-success);
	}
	.menu-missing {
		background: var(--color-danger-bg);
		color: var(--color-danger);
	}

	.card-preview {
		font-size: 12px;
		opacity: 0.5;
		margin-top: 10px;
		line-height: 1.5;
		max-height: 55px;
		overflow: hidden;
		white-space: pre-line;
	}

	/* ===== BANNERS ===== */
	.warning-banner {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 14px;
		background: var(--color-warning-bg);
		border: 1px solid var(--color-warning-border);
		border-radius: 8px;
		font-size: 13px;
		color: var(--color-warning);
		margin-bottom: 18px;
		line-height: 1.5;
	}
	.warning-banner a {
		color: var(--color-warning);
		font-weight: 600;
	}
	.banner-ok {
		background: var(--color-success-bg);
		border-color: var(--color-success-border);
		color: var(--color-success);
		margin-bottom: 24px;
	}
	.warn-icon {
		font-size: 15px;
		flex-shrink: 0;
		margin-top: 1px;
	}
	.warn-text {
		flex: 1;
	}
	.warn-text strong {
		color: var(--color-warning-strong);
	}
	.banner-ok .warn-text strong {
		color: var(--color-success-strong);
	}

	/* ===== FORM ===== */
	.form-section {
		margin-bottom: 20px;
	}
	.form-section:last-child {
		margin-bottom: 0;
	}

	.field-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 5px;
	}

	.hint {
		font-size: 12px;
		opacity: 0.5;
		margin-top: 4px;
		line-height: 1.4;
		overflow-wrap: break-word;
	}

	.textarea {
		width: 100%;
		box-sizing: border-box;
		font-family: monospace;
		font-size: 13px;
		padding: 10px 12px;
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		background: var(--color-bg);
		color: var(--color-fg);
		resize: vertical;
		line-height: 1.5;
		min-height: 180px;
	}
	.textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.date-input {
		font-family: inherit;
		box-sizing: border-box;
		font-size: 14px;
		padding: 10px 12px;
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		background: var(--color-bg);
		color: var(--color-fg);
		cursor: pointer;
		width: 200px;
	}
	.date-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.input {
		width: 100%;
		box-sizing: border-box;
		font-family: monospace;
		font-size: 13px;
		padding: 10px 12px;
		border: solid var(--color-fg) var(--border-width);
		border-radius: var(--border-radius);
		background: var(--color-bg);
		color: var(--color-fg);
	}
	.input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.action-bar {
		display: flex;
		gap: 8px;
		align-items: center;
		padding-top: 20px;
		margin-top: 24px;
	}

	/* ===== TOAST ===== */
	.toast-container {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toast {
		background: var(--color-fg);
		color: var(--color-bg);
		padding: 12px 18px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		animation: slideIn 0.25s ease;
		max-width: 360px;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.error-text {
		font-size: 12px;
		color: var(--color-danger);
		margin-top: 4px;
	}

	.form-error {
		margin-bottom: 8px;
	}

	.confirm-text {
		font-size: 14px;
		opacity: 0.7;
		line-height: 1.5;
		margin-bottom: 4px;
	}
	.confirm-text strong {
		opacity: 1;
		font-weight: 600;
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

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		.app-shell {
			flex-direction: column;
		}

		.main-header {
			padding: 16px 16px 0;
		}
		.main-body {
			padding: 16px;
		}
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
		.action-bar {
			flex-direction: column;
		}
		.date-input {
			width: 100%;
		}
	}
</style>
