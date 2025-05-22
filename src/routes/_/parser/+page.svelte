<script lang="ts">
  import Button from '$lib/Button.svelte';

  let textareaText = $state('');

  const buttonOriginalText: string = 'Скопировать таблицу';
  let buttonText = $state(buttonOriginalText);

  let timeoutId: number | undefined;

  async function handleSubmit() {
    const response = await fetch('/_/parser', {
      method: 'POST',
      body: JSON.stringify({ text: textareaText }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const tsv: string = (await response.json()).data;

    try {
      await navigator.clipboard.writeText(tsv);
      buttonText = 'Готово';
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        buttonText = buttonOriginalText;
      }, 1000);
    } catch (err) {
      console.error('Async: Could not copy text: ', err);
    }
  }
</script>

<h1>Парсер сообщений от бота</h1>

<p>
  <a
    href="https://docs.google.com/spreadsheets/d/1Xver_uuh6sDZoi2XkI8695OFrP8Rzo-vs6qZoTPUl5k/edit?usp=sharing"
    target="_blank">Шаблон</a
  > с удобными формулами
</p>

<form on:submit|preventDefault={handleSubmit}>
  <label for="textarea">Вставьте сообщения с заказами</label>
  <textarea
    rows="10"
    id="textarea"
    placeholder="Сюда"
    bind:value={textareaText}
  />
  <Button primary block>{buttonText}</Button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    margin-block-start: 2em;
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
