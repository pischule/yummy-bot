<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let { receiptDate, itemsString } = data;

	$: isNoItems = !itemsString.trim();
</script>

<h2>Редактирование</h2>

<form method='POST'>
	<div>
		<label for='receiptDate'>
			Дата
		</label>
		<input id='receiptDate' name='receiptDate' type='date' bind:value={receiptDate} required>
	</div>

	<div>
		<label for='items'>
			Меню
		</label>
		<textarea id='items' name='items' rows='15' cols='35' bind:value={itemsString}></textarea>
	</div>

	<div class='buttons-container'>
		<Button disabled={isNoItems} formaction='?/saveAndSend' main fullwidth>Сохранить и отправить</Button>
		<Button formaction='?/save' fullwidth>Сохранить</Button>
	</div>
</form>

<style>
    textarea {
        padding: 8px;
        width: calc(100% - 16px);
        display: block;

				font-family: inherit;
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