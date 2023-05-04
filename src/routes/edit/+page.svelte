<script lang='ts'>
	import Button from '$lib/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let date = data.date;
	let items = data.items;
</script>

<h2>Редактирование</h2>

<form method='post'>
	<div>
		<label for='date'>
			Дата
		</label>
		<input id='date' name='date' type='date' bind:value={date}>
	</div>

	<div>
		<label for='items'>
			Меню
		</label>
		<textarea id='items' name='items' rows='15' cols='35' bind:value={items}></textarea>
	</div>

	<div class='buttons-container'>
		<div class='main-btn'>
			<Button main fullwidth>Сохранить и отправить</Button>
		</div>
		<Button fullwidth>Сохранить</Button>
		<Button fullwidth>Отправить</Button>
		<Button fullwidth>Сбросить</Button>
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
    }

    .buttons-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .main-btn {
        grid-column: 1 / 4;
    }

    form > div {
        padding-bottom: 10px;
    }

</style>