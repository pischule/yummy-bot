<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/Button.svelte';
	import Dialog from '$lib/Dialog.svelte';

	let { data, form } = $props();

	let editingId = $state<string | null>(null);
	let showAddDialog = $state(false);

	let addName = $state('');
	let addChatId = $state('');

	let editName = $state('');
	let editChatId = $state('');

	function startEditing(loc: { id: string; name: string; chatId: string }) {
		editingId = loc.id;
		editName = loc.name;
		editChatId = loc.chatId;
	}

	// SVGs for icons
	const icons = {
		plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
		pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
		trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
		check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
		x: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
		info: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
	};
</script>

<div class="page-header">
	<div class="title-group">
		<h2>Локации</h2>
		<p class="subtitle">Управление точками доставки и чатами</p>
	</div>
	<Button flat primary sm onclick={() => (showAddDialog = true)}>
		<span class="icon-inline">{@html icons.plus}</span>
		Добавить
	</Button>
</div>

{#if form?.error}
	<div class="error-banner">
		{@html icons.info}
		<span>{form.error}</span>
	</div>
{/if}

<div class="table-container">
	<table>
		<thead>
			<tr>
				<th>Название</th>
				<th>ID чата</th>
				<th class="actions-col"></th>
			</tr>
		</thead>
		<tbody>
			{#if data.locations.length === 0}
				<tr>
					<td colspan="3" class="empty-state">
						<div class="empty-content">
							<p>Локаций пока нет.</p>
							<button class="text-link" onclick={() => (showAddDialog = true)}
								>Добавить первую локацию</button
							>
						</div>
					</td>
				</tr>
			{:else}
				{#each data.locations as loc (loc.id)}
					{#if editingId === loc.id}
						<tr class="editing-row">
							<td colspan="3">
								<form
									method="POST"
									action="?/updateLocation"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												editingId = null;
											}
											await update();
										};
									}}
									class="inline-edit-form"
								>
									<input type="hidden" name="id" value={loc.id} />
									<div class="input-group">
										<input
											type="text"
											name="name"
											bind:value={editName}
											placeholder="Название"
											autocomplete="off"
											required
										/>
									</div>
									<div class="input-group">
										<input
											type="text"
											name="chatId"
											bind:value={editChatId}
											placeholder="ID чата"
											inputmode="numeric"
											pattern="-?[0-9]+"
											autocomplete="off"
											required
										/>
									</div>
									<div class="action-buttons">
										<button type="submit" class="icon-btn success" title="Сохранить">
											{@html icons.check}
										</button>
										<button
											type="button"
											class="icon-btn cancel"
											onclick={() => (editingId = null)}
											title="Отмена"
										>
											{@html icons.x}
										</button>
									</div>
								</form>
							</td>
						</tr>
					{:else}
						<tr>
							<td class="name-cell">{loc.name}</td>
							<td class="chat-id-cell"><code>{loc.chatId || '\u2014'}</code></td>
							<td class="actions-col">
								<div class="action-group">
									<button
										class="icon-btn edit"
										onclick={() => startEditing(loc)}
										title="Редактировать"
									>
										{@html icons.pencil}
									</button>
									<form
										method="POST"
										action="?/deleteLocation"
										use:enhance={({ cancel }) => {
											if (!confirm(`Удалить локацию "${loc.name}"?`)) {
												cancel();
												return;
											}
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={loc.id} />
										<button type="submit" class="icon-btn danger" title="Удалить">
											{@html icons.trash}
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<Dialog bind:open={showAddDialog}>
	<h3>Новая локация</h3>
	<form
		method="POST"
		action="?/addLocation"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					showAddDialog = false;
					addName = '';
					addChatId = '';
				}
				await update();
			};
		}}
	>
		<div class="field">
			<label for="add-name">Название</label>
			<input
				id="add-name"
				type="text"
				name="name"
				bind:value={addName}
				placeholder="Например: Офис на Ленина"
				autocomplete="off"
				required
			/>
		</div>
		<div class="field">
			<label for="add-chatId">ID чата</label>
			<input
				id="add-chatId"
				type="text"
				name="chatId"
				bind:value={addChatId}
				placeholder="-100123456789"
				inputmode="numeric"
				pattern="-?[0-9]+"
				autocomplete="off"
				required
			/>
			<p class="field-hint">
				Добавьте <a href="https://t.me/{data.botUsername}" target="_blank">@{data.botUsername}</a> в
				чат и вызовите <code>/chatid</code>
			</p>
		</div>

		<div class="modal-footer">
			<Button flat sm type="button" onclick={() => (showAddDialog = false)}>Отмена</Button>
			<Button flat primary sm type="submit">Создать</Button>
		</div>
	</form>
</Dialog>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.title-group h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.subtitle {
		margin: 0.15rem 0 0;
		color: var(--color-muted);
		font-size: 0.8rem;
	}

	.icon-inline {
		display: inline-flex;
		vertical-align: middle;
		margin-right: 0.25rem;
	}

	.error-banner {
		background-color: var(--color-danger-bg);
		color: var(--color-danger);
		padding: 0.6rem 0.85rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.8rem;
		border: 1px solid var(--color-danger);
	}

	.table-container {
		background: var(--color-bg);
		border: 1px solid var(--color-subtle);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	thead th {
		padding: 0.6rem 0.85rem;
		background: var(--color-surface-bg);
		border-bottom: 1px solid var(--color-subtle);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--color-muted);
	}

	tbody td {
		padding: 0.6rem 0.85rem;
		border-bottom: 1px solid var(--color-subtle);
		vertical-align: middle;
		font-size: 0.875rem;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.name-cell {
		font-weight: 500;
	}

	.chat-id-cell code {
		background: var(--color-hover-bg);
		padding: 0.15rem 0.35rem;
		border-radius: 3px;
		font-size: 0.8rem;
	}

	.actions-col {
		width: 80px;
		text-align: right;
	}

	.action-group {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.icon-btn {
		background: none;
		border: 1px solid transparent;
		padding: 0.35rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted);
		transition: all 0.1s;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.icon-btn:hover {
		background: var(--color-hover-bg);
		color: var(--color-fg);
	}

	.icon-btn.danger:hover {
		background: var(--color-danger-bg);
		color: var(--color-danger);
	}

	.icon-btn.success {
		color: var(--color-success);
	}

	.editing-row {
		background: var(--color-surface-bg) !important;
	}

	.inline-edit-form input[type='hidden'] {
		display: none;
	}

	.inline-edit-form {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 1rem;
		align-items: center;
	}

	.inline-edit-form > :not(input[type='hidden']) {
		min-width: 0;
	}

	.action-buttons {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.input-group {
		min-width: 0;
	}

	.input-group input {
		width: 100%;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--color-subtle);
		border-radius: 4px;
		font-size: 0.875rem;
		background: var(--color-bg);
		transition: border-color 0.15s;
	}

	.input-group input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.empty-state {
		padding: 2.5rem 1rem !important;
		text-align: center;
	}

	.empty-content p {
		margin: 0 0 0.5rem;
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.text-link {
		background: none;
		border: none;
		color: var(--color-accent);
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		font: inherit;
		font-size: 0.875rem;
	}

	/* Modal styles */
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}

	.field label {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.field input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--color-subtle);
		border-radius: 6px;
		font-size: 0.9375rem;
		background: var(--color-bg);
		transition: border-color 0.15s;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.field-hint {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-muted);
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.inline-edit-form {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.actions-col {
			width: auto;
		}
	}
</style>
