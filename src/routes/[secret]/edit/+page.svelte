<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h2>Редактирование</h2>

<form method='POST'>
	<div>
		<label for='receiptDate'>
			Дата
		</label>
		<input id='receiptDate' name='receiptDate' type='date' value={data.receiptDate} required>
	</div>

	<div>
		<label for='items'>
			Меню
		</label>
		<textarea id='items' name='items' rows='15' cols='35'>{data.itemsString}</textarea>
	</div>

	<div class='buttons-container'>
		<div class='main-btn'>
			<Button formaction='?/saveAndSend' main fullwidth>Сохранить и отправить</Button>
		</div>
		<Button formaction='?/save' fullwidth>Сохранить</Button>
		<Button formaction='?/send' fullwidth>Отправить</Button>
	</div>
</form>

<style>
    label {
        display: block;
        margin-bottom: 4px;
    }

    textarea {
        width: calc(100% - 20px);
        padding: 10px;
        line-height: 1.4;
        max-width: 100%;
        display: block;
        font-family: sans-serif;
    }

    .buttons-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .main-btn {
        grid-column: 1 / 3;
    }

    form > div {
        padding-bottom: 10px;
    }
</style>