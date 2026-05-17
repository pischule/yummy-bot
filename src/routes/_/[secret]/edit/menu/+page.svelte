<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/Button.svelte';

	let { data, form } = $props();

	let menuText = $state('');
	let menuDate = $state('');

	let postStatusText = $state('');
	let postStatusVisible = $state(false);

	let menuStatusText = $derived.by(() => {
		const loc = data.selectedLocation;
		if (!loc) return 'Сначала выберите локацию.';
		if (!loc.hasActiveMenu) return 'Меню не задано.';
		if (loc.postedAt) {
			const t = new Date(loc.postedAt).toLocaleTimeString('ru-RU', {
				hour: '2-digit',
				minute: '2-digit'
			});
			return `Опубликовано в ${t}`;
		}
		const t = new Date(loc.updatedAt).toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit'
		});
		return `Черновик, сохранён в ${t}`;
	});

	function todayStr() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	$effect(() => {
		const loc = data.selectedLocation;
		if (loc?.hasActiveMenu) {
			menuText = loc.items.join('\n');
			menuDate = loc.receiptDate || todayStr();
		} else {
			menuText = '';
			menuDate = todayStr();
		}
	});

	function afterMutation() {
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
		};
	}

	$effect(() => {
		if (form?.type === 'postMenu') {
			if (form.success) {
				postStatusText = 'Опубликовано!';
			} else {
				postStatusText = `Ошибка: ${form.error}`;
			}
			postStatusVisible = true;
			const t = setTimeout(() => {
				postStatusVisible = false;
			}, 4000);
			return () => clearTimeout(t);
		}
	});

	function handlePublish() {
		const loc = data.selectedLocation;
		if (!loc) return;
		const fd = new FormData();
		fd.set('locationId', loc.id);
		fd.set('receiptDate', menuDate);
		fd.set('items', menuText);
		fd.set('chatId', loc.chatId);
		fetch('?/postMenu', { method: 'POST', body: fd }).then(() => {
			window.location.reload();
		});
	}

	const icons = {
		save: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
		send: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
		info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
		calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
	};
</script>

<div class="page-header">
	<div class="title-group">
		<h2>Редактор меню</h2>
		{#if data.selectedLocation}
			<p class="subtitle">Локация: <strong>{data.selectedLocation.name}</strong></p>
		{:else}
			<p class="subtitle">Выберите локацию слева</p>
		{/if}
	</div>

	{#if data.selectedLocation}
		<div class="status-badge" class:published={data.selectedLocation.postedAt}>
			<span class="icon-inline">{@html icons.info}</span>
			{menuStatusText}
		</div>
	{/if}
</div>

{#if postStatusVisible}
	<div class="banner" class:error={!form?.success}>
		{@html icons.info}
		<span>{postStatusText}</span>
	</div>
{/if}

<div class="editor-container">
	<form method="POST" action="?/saveMenu" use:enhance={afterMutation} id="menu-form">
		<input type="hidden" name="locationId" value={data.selectedLocation?.id ?? ''} />

		<div class="field date-field">
			<label for="receiptDate"> Дата доставки </label>
			<input
				type="date"
				id="receiptDate"
				name="receiptDate"
				bind:value={menuDate}
				required
				disabled={!data.selectedLocation}
			/>
		</div>

		<div class="field">
			<label for="items">Пункты меню</label>
			<p class="field-hint">Введите каждое блюдо с новой строки</p>
			<textarea
				id="items"
				name="items"
				rows="10"
				placeholder="Пицца Маргарита
Салат Цезарь
Суп дня"
				disabled={!data.selectedLocation}
				bind:value={menuText}
				required
			></textarea>
		</div>

		<div class="form-actions">
			<Button flat flex sm type="submit" disabled={!data.selectedLocation}>
				<span class="icon-inline">{@html icons.save}</span>
				Сохранить
			</Button>
			<Button
				flat
				primary
				flex
				sm
				type="button"
				disabled={!data.selectedLocation}
				onclick={handlePublish}
			>
				<span class="icon-inline">{@html icons.send}</span>
				Опубликовать
			</Button>
		</div>
	</form>
</div>

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

	.status-badge {
		padding: 0.35rem 0.65rem;
		border-radius: 4px;
		background: var(--color-surface-bg);
		border: 1px solid var(--color-muted);
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		color: var(--color-fg);
	}

	.status-badge.published {
		background: var(--color-success-bg);
		border-color: var(--color-success-border);
		color: var(--color-success-strong);
	}

	.icon-inline {
		display: inline-flex;
		vertical-align: middle;
		margin-right: 0.35rem;
	}

	.banner {
		padding: 0.6rem 0.85rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.8rem;
		background-color: var(--color-success-bg);
		color: var(--color-success-strong);
		border: 1px solid var(--color-success-border);
	}

	.banner.error {
		background-color: var(--color-danger-bg);
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.editor-container {
		max-width: 600px;
	}

	#menu-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}

	.date-field {
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.date-field label {
		margin: 0;
		white-space: nowrap;
	}

	input[type='date'],
	textarea {
		padding: 0.65rem 0.8rem;
		font-size: 0.9375rem;
		border: 1px solid var(--color-subtle);
		border-radius: 6px;
		background: var(--color-bg);
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	input:disabled,
	textarea:disabled {
		background: var(--color-hover-bg);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.field-hint {
		margin: -0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-muted);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.date-field {
			flex-direction: column;
			align-items: flex-start;
		}

		.form-actions {
			flex-direction: column;
		}

		.status-badge {
			align-self: flex-start;
		}
	}
</style>
