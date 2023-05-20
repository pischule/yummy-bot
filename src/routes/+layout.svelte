<script>
  import '$lib/assets/global.css';
</script>

<main>
  <slot />
</main>

<style>
  main {
    max-width: min(65ch, 100% - 1rem);
    margin-inline: auto;
    padding-block-end: 8px;
  }
</style>
