<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;

	$: isNoItems = !data?.itemsString?.trim();
</script>

<h1>Редактирование</h1>

<form method='POST' use:enhance>
	<div>
		<label for='receiptDate'>
			Дата
		</label>
		<input id='receiptDate' name='receiptDate' type='date' bind:value={data.receiptDate} required>
	</div>

	<div>
		<label for='items'>
			Меню
		</label>
		<textarea id='items' name='items' rows='15' cols='35' bind:value={data.itemsString}></textarea>
	</div>

	<div class='buttons-container'>
		<Button disabled={isNoItems} formaction='?/saveAndSend' block primary>Сохранить и отправить</Button>
		<Button formaction='?/save' block>Сохранить</Button>
	</div>
</form>

<style>
    input, textarea {
        font-size: 1em;
        padding: 8px;
        border-radius: var(--border-radius);
        border: solid var(--color-fg) var(--border-width);
    }

    textarea {
        font-family: inherit;
        width: calc(100% - 20px);
        display: block;
        line-height: 1.25;
    }

    .buttons-container {
        display: flex;
        gap: 8px;
        flex-direction: column;
    }

    form > div {
        padding-bottom: 10px;
    }
</style>