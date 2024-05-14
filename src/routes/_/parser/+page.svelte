<script lang="ts">
  import { ordersToCsv } from '$lib/messagesParser';
  import Button from '$lib/Button.svelte';

  let textareaText: string = '';

  function download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  function handleSubmit() {
    const date = new Date().toJSON().split('T')[0];
    const csv = ordersToCsv(textareaText);
    download(`заказы-${date}.csv`, csv);
  }
</script>

<h1>Парсер сообщений от бота</h1>

<form on:submit|preventDefault={handleSubmit}>
  <label for="textarea">Вставьте сообщения с заказами</label>
  <textarea rows="10" id="textarea" placeholder="Сюда" bind:value={textareaText}></textarea>
  <Button primary block>Скачать CSV</Button>
</form>

<style>
  form {
      display: flex;
      flex-direction: column;
  }

  textarea {
      font-size: 1em;
      padding: 8px;
      border-radius: var(--border-radius);
      border: solid var(--color-fg) var(--border-width);
      font-family: inherit;
      width: calc(100% - 20px);
      display: block;
      line-height: 1.25;

      margin-block-end: 10px;
  }
</style>