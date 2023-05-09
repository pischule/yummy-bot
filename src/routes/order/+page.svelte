<script lang='ts'>
	import type { PageData } from './$types';
	import ChooseStep from './ChooseStep.svelte';
	import ConfirmStep from './ConfirmStep.svelte';
	import DoneStep from './DoneStep.svelte';
	import NoMenu from './NoMenu.svelte';

	export let data: PageData;

	const steps = ['choose', 'confirm', 'done'];
	let currentStep = steps[0];

	let items = [];
	let orderedItems: Item[] = [];

	const handleChoose = (event) => {
		orderedItems = event.detail.items;
		currentStep = steps[1];
	};

	const handleConfirm = (event) => {
		currentStep = steps[2];
	};

	if (data.menu) {
		items = data.menu.items.map((name) => ({ name, qty: 0 })) ?? [];
	}
</script>


{#if data.menu}
	{#if currentStep === 'choose'}
		<ChooseStep {items} weekday={data.weekday} on:choose={handleChoose} />
	{:else if currentStep === 'confirm'}
		<ConfirmStep {orderedItems} on:confirm={handleConfirm} />
	{:else}
		<DoneStep />
	{/if}
{:else}
	<NoMenu />
{/if}