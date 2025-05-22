<script lang="ts">
  import type { PageData } from './$types';
  import ChooseStep from './ChooseStep.svelte';
  import ConfirmStep from './ConfirmStep.svelte';
  import DoneStep from './DoneStep.svelte';
  import NoMenu from './NoMenu.svelte';

  interface Item {
    name: string;
    qty: number;
  }

  let data: PageData = $props();

  const steps = ['choose', 'confirm', 'done'];
  let currentStep = $state(steps[0]);

  let items = $state(
    data.menu?.items.map((name: string) => ({ name, qty: 0 })) ?? [],
  );
  let orderedItems = $state<Item[]>([]);

  const handleChoose = (event: CustomEvent<{ items: Item[] }>) => {
    orderedItems = event.detail.items;
    currentStep = steps[1];
  };

  const handleConfirm = () => {
    currentStep = steps[2];
  };
</script>

{#if data.menu}
  {#if currentStep === 'choose'}
    <ChooseStep {items} weekday={data.weekday} on:choose={handleChoose} />
  {:else if currentStep === 'confirm'}
    <ConfirmStep
      nameFromServer={data.name}
      {orderedItems}
      on:confirm={handleConfirm}
    />
  {:else}
    <DoneStep />
  {/if}
{:else}
  <NoMenu />
{/if}
