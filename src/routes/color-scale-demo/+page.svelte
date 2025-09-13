<script lang="ts">
	import { createSubscriberColorScale } from '$lib/components/3d-networks/colorUtils.js';
	
	// Sample data from the knowledge graph
	const sampleNodes = [
		{ id: "Business & Finance", avg_subscriber_count: 41418 },
		{ id: "Arts & Culture", avg_subscriber_count: 46983 },
		{ id: "Food & Lifestyle", avg_subscriber_count: 45091 },
		{ id: "General & Personal", avg_subscriber_count: 52356 },
		{ id: "Technology & AI", avg_subscriber_count: 45342 },
		{ id: "micro_2", avg_subscriber_count: 28948 },
		{ id: "micro_17", avg_subscriber_count: 63528 }
	];
	
	const colorScale = createSubscriberColorScale(sampleNodes);
	
	// Create a range of values for demonstration
	const minCount = 27146;
	const maxCount = 63528;
	const demoValues = [];
	for (let i = 0; i <= 10; i++) {
		const value = minCount + (maxCount - minCount) * (i / 10);
		demoValues.push({
			count: Math.round(value),
			color: colorScale(value)
		});
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="h1 mb-8">D3 Interpolate Oranges Color Scale Demo</h1>
	
	<div class="card p-6 mb-8">
		<h2 class="h2 mb-4">Color Scale Range</h2>
		<p class="mb-4">
			This demonstrates the D3 interpolate oranges linear scale applied to average subscriber counts.
			Range: {minCount.toLocaleString()} - {maxCount.toLocaleString()} subscribers
		</p>
		
		<div class="grid grid-cols-1 gap-2">
			{#each demoValues as { count, color }}
				<div class="flex items-center gap-4">
					<div 
						class="w-12 h-12 rounded border-2 border-surface-300"
						style="background-color: {color}"
					></div>
					<span class="font-mono">{count.toLocaleString()} subscribers</span>
					<span class="text-sm opacity-75">{color}</span>
				</div>
			{/each}
		</div>
	</div>
	
	<div class="card p-6">
		<h2 class="h2 mb-4">Sample Topic Colors</h2>
		<div class="grid grid-cols-1 gap-2">
			{#each sampleNodes as node}
				<div class="flex items-center gap-4">
					<div 
						class="w-12 h-12 rounded border-2 border-surface-300"
						style="background-color: {colorScale(node.avg_subscriber_count)}"
					></div>
					<div class="flex-1">
						<div class="font-semibold">{node.id}</div>
						<div class="text-sm opacity-75">{node.avg_subscriber_count.toLocaleString()} avg subscribers</div>
					</div>
					<span class="text-sm font-mono">{colorScale(node.avg_subscriber_count)}</span>
				</div>
			{/each}
		</div>
	</div>
</div>