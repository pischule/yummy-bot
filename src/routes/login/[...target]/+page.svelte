<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let status = $state<'working' | 'error'>('working');
	let errorMessage = $state('');

	async function getInitData(): Promise<string> {
		// telegram-web-app.js may finish loading after the app scripts — poll briefly.
		for (let i = 0; i < 50; i++) {
			const initData = window.Telegram?.WebApp?.initData;
			if (initData) return initData;
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return window.Telegram?.WebApp?.initData ?? '';
	}

	onMount(async () => {
		const webApp = window.Telegram?.WebApp;
		webApp?.ready();
		webApp?.expand();

		const target = page.params.target;
		const initData = await getInitData();

		try {
			const res = await fetch(`/login/${target}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ initData })
			});
			if (res.ok) {
				const body = (await res.json()) as { redirectTo: string };
				location.assign(body.redirectTo);
				return;
			}
			status = 'error';
			if (res.status === 400) {
				errorMessage = 'Откройте эту страницу через кнопку в Telegram.';
			} else if (res.status === 403) {
				errorMessage = 'У вас нет доступа.';
			} else {
				errorMessage = 'Не удалось войти.';
			}
		} catch {
			status = 'error';
			errorMessage = 'Не удалось связаться с сервером.';
		}
	});
</script>

<svelte:head>
	<title>Вход</title>
	<script src="https://telegram.org/js/telegram-web-app.js?63"></script>
</svelte:head>

{#if status === 'working'}
	<p>Входим…</p>
{:else}
	<p>{errorMessage}</p>
{/if}

<style>
	:global(body) {
		background: var(--color-bg, #111);
		color: var(--color-fg, #eee);
	}
	p {
		font-family: system-ui, sans-serif;
		padding: 1rem;
	}
</style>
