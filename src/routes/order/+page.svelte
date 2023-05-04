<script lang='ts'>
	import type { PageData } from './$types';
	import ChooseStep from './ChooseStep.svelte';
	import ConfirmStep from './ConfirmStep.svelte';
	import DoneStep from './DoneStep.svelte';

	export let data: PageData;

	const steps = ['choose', 'confirm', 'done'];
	let currentStep = steps[0];

	let items = data.menu.items.map((name) => ({ name, qty: 0 }));

	let orderedItems = [];

	const handleChoose = (event) => {
		orderedItems = event.detail.items;
		currentStep = steps[1];
	};

	const handleConfirm = (event) => {
		currentStep = steps[2];
	};

</script>

{#if currentStep === 'choose'}
	<ChooseStep {items} on:choose={handleChoose} />
{:else if currentStep === 'confirm'}
	<ConfirmStep {orderedItems} on:confirm={handleConfirm} />
{:else}
	<DoneStep />
{/if}

