<script lang="ts">
	import type { PageProps } from './$types';
	import ChooseStep from './ChooseStep.svelte';
	import ConfirmStep from './ConfirmStep.svelte';
	import DoneStep from './DoneStep.svelte';
	import NoMenu from './NoMenu.svelte';

	let { data }: PageProps = $props();

	function toItemWithQty(items: string[]): Item[] {
		return items.map((name: string) => ({ name, qty: 0 })) ?? [];
	}

	let currentStep = $state(0);
	let items = $state(toItemWithQty(data.items));

	function onUpdateItemQty(item: Item, increment: number) {
		item.qty = Math.max(item.qty + increment, 0);
	}

	function onChoose() {
		currentStep = 1;
	}

	function onConfirm() {
		currentStep = 2;
	}
</script>

{#if data.items.length > 0}
	{#if currentStep === 0}
		<ChooseStep {items} day={data.day} {onUpdateItemQty} {onChoose} />
	{:else if currentStep === 1}
		<ConfirmStep nameFromServer={data.name} {items} {onConfirm} />
	{:else}
		<DoneStep />
	{/if}
{:else}
	<NoMenu />
{/if}
