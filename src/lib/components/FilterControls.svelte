<script lang="ts">
	export interface Props {
		selectedBoard: 'all' | 'free' | 'paid';
		onBoardChange: (board: 'all' | 'free' | 'paid') => void;
	}
	
	let { selectedBoard, onBoardChange }: Props = $props();
	
	const boardOptions = [
		{ value: 'all' as const, label: 'All' },
		{ value: 'free' as const, label: 'Free' },
		{ value: 'paid' as const, label: 'Paid' }
	];
</script>

<div class="filter-controls">
	<div class="label mb-2">
		<span>Board Type Filter:</span>
	</div>
	<div class="btn-group" role="group" aria-label="Filter by board type">
		{#each boardOptions as option}
			<button 
				class="btn {selectedBoard === option.value ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
				onclick={() => onBoardChange(option.value)}
				aria-pressed={selectedBoard === option.value}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.filter-controls {
		@apply mb-6;
	}
</style>