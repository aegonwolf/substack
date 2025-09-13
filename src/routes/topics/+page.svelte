<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import TopicGalaxy from '$lib/components/3d-networks/TopicGalaxy.svelte';

	let topicData: any = null;
	let loading = $state(true);
	let error = $state<string | null>(null);
	let galaxyRef: TopicGalaxy;

	// Search functionality
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let showSearchResults = $state(false);

	async function loadTopicData() {
		try {
			const response = await fetch('/jsons/topics/knowledge_graph.json');
			if (!response.ok) {
				throw new Error(`Failed to load topic data: ${response.status}`);
			}
			topicData = await response.json();
			console.log(
				`Loaded ${topicData.nodes.length} nodes:`,
				topicData.nodes.map((n) => n.id)
			);
			loading = false;
		} catch (e: any) {
			error = e.message || 'Failed to load topic galaxy data';
			loading = false;
		}
	}

	function searchTopics(query: string) {
		if (!query.trim() || !topicData) {
			searchResults = [];
			showSearchResults = false;
			return;
		}

		const results = topicData.nodes.filter(
			(topic: any) =>
				topic.id.toLowerCase().includes(query.toLowerCase()) ||
				(topic.label && topic.label.toLowerCase().includes(query.toLowerCase())) ||
				(topic.macro_topic && topic.macro_topic.toLowerCase().includes(query.toLowerCase()))
		);

		searchResults = results;
		showSearchResults = true;

		// Highlight matching topics
		if (results.length > 0) {
			const nodeIds = results.map((topic: any) => topic.id);
			galaxyRef?.highlightNodes(nodeIds);
		}
	}

	function selectTopic(topic: any) {
		galaxyRef?.highlightNode(topic.id);
		galaxyRef?.focusNode(topic.id);
		showSearchResults = false;
		searchQuery = topic.type === 'macro' ? topic.id : topic.label?.split(': ')[1] || topic.id;
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		showSearchResults = false;
		galaxyRef?.clearHighlight();
	}

	$effect(() => {
		searchTopics(searchQuery);
	});

	onMount(() => {
		if (browser) {
			loadTopicData();
		}
	});
</script>

<svelte:head>
	<title>Topic Galaxy - Substack Network Explorer</title>
	<meta
		name="description"
		content="Explore the galaxy of Substack topics and their interconnections"
	/>
</svelte:head>

<div class="text-on-surface h-screen w-full bg-surface-900">
	<!-- Search -->
	<div class="absolute top-20 left-1/2 z-40 -translate-x-1/2 transform">
		<div class="relative w-96">
			<input
				bind:value={searchQuery}
				type="text"
				placeholder="Search topics or newsletters..."
				class="text-on-surface input w-full border-surface-600 bg-surface-800/90 placeholder-surface-400 backdrop-blur-sm"
			/>
			{#if searchQuery}
				<button
					onclick={clearSearch}
					class="hover:text-on-surface absolute top-1/2 right-2 -translate-y-1/2 text-surface-400"
				>
					✕
				</button>
			{/if}

			<!-- Search Results -->
			{#if showSearchResults && searchResults.length > 0}
				<div
					class="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-surface-600 bg-surface-800/95 shadow-xl backdrop-blur-sm"
				>
					{#each searchResults as topic}
						<button
							onclick={() => selectTopic(topic)}
							class="w-full border-b border-surface-600 p-3 text-left last:border-b-0 hover:bg-surface-700"
						>
							<div class="text-on-surface text-sm font-medium">
								{topic.type === 'macro' ? topic.id : topic.label?.split(': ')[1] || topic.id}
							</div>
							<div class="mt-1 text-xs text-surface-400">
								{topic.type === 'macro'
									? 'Macro Topic'
									: `Micro Topic • Parent: ${topic.macro_topic}`}
								{#if topic.subscriber_sum > 0}
									• {topic.subscriber_sum.toLocaleString()} subscribers
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="h-full">
		{#if loading}
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
					></div>
					<h2 class="h2 text-primary-400">Loading Topic Galaxy</h2>
					<p class="text-surface-400">Mapping the Substack universe...</p>
				</div>
			</div>
		{:else if error}
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<h2 class="h2 text-error-400">Error Loading Galaxy</h2>
					<p class="mt-2 text-surface-400">{error}</p>
					<button onclick={loadTopicData} class="mt-4 btn preset-filled-primary-500">
						Retry
					</button>
				</div>
			</div>
		{:else if topicData}
			<TopicGalaxy bind:this={galaxyRef} {topicData} backgroundColor="#0a0a0a" />
		{/if}
	</div>

	<!-- Legend -->
	{#if topicData && !loading}
		<div class="absolute bottom-4 left-4 z-20">
			<div
				class="max-w-sm rounded-lg border border-surface-600/30 bg-surface-800/90 p-4 backdrop-blur-sm"
			>
				<h3 class="text-on-surface mb-2 text-sm font-semibold">Topic Galaxy</h3>
				<div class="space-y-1 text-xs text-surface-300">
					<div>• Node size = post volume</div>
					<div>• Link thickness = shared newsletters</div>
					<div>• Click to explore connections</div>
				</div>
			</div>
		</div>
	{/if}
</div>
