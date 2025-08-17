<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Component props using Svelte 5 runes
	let {
		graphData,
		backgroundColor = '#000000'
	}: {
		graphData: { nodes: any[]; links: any[]; metadata: any };
		backgroundColor?: string;
	} = $props();

	// Component state
	let graphContainer: HTMLDivElement;
	let forceGraphInstance: any = null;
	let isInitialized = $state(false);
	let error = $state<string | null>(null);

	// Single reactive tooltip state with mouse tracking
	let hoveredNode = $state<any>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });

	// Track mouse position for tooltip
	function handleMouseMove(event: MouseEvent) {
		if (hoveredNode) {
			tooltipPosition = { x: event.clientX, y: event.clientY };
		}
	}

	// Derive tooltip content reactively
	let tooltipContent = $derived(
		(() => {
			const content = {
				show: hoveredNode !== null,
				name: hoveredNode?.name || '',
				category: hoveredNode?.category || '',
				subscriberText: hoveredNode?.subscriber_count
					? hoveredNode.subscriber_count >= 1000
						? `${Math.round(hoveredNode.subscriber_count / 1000)}k subscribers`
						: `${hoveredNode.subscriber_count} subscribers`
					: 'No subscriber data',
				isBestseller: hoveredNode?.is_bestseller || false
			};
			return content;
		})()
	);

	// Event handlers
	const handleNodeHover = (node: any) => {
		hoveredNode = node;
	};

	const focusNode = (node: any, ms = 800) => {
  if (!node || !forceGraphInstance) return;

  const ctrls: any = forceGraphInstance.controls();

  // robust current coords (works for both d3 & ngraph engines)
  const p = node.__threeObj?.position ?? { x: node.x, y: node.y, z: node.z };
  const x = p?.x ?? 0, y = p?.y ?? 0, z = p?.z ?? 0;

  // same idea as the official example: move along the node->camera ray
  const distance = Math.max(40, (forceGraphInstance.getGraphBbox()?.x[1] ?? 200) * 0.2);
  const denom = Math.hypot(x || 1, y || 1, z || 1); // avoid 0/0
  const distRatio = 1 + distance / denom;

  forceGraphInstance.cameraPosition(
    { x: x * distRatio, y: y * distRatio, z: z * distRatio },
    { x, y, z },
    ms
  );

  // ensure orbit/zoom revolves around the node
  ctrls.target.set(x, y, z);
  if (typeof ctrls.update === 'function') ctrls.update();
};

	const handleNodeClick = (node: any) => {
		console.log('Node clicked:', node.name, node);
		focusNode(node, 800, 140);
	};

	// Component lifecycle - onMount
	onMount(async () => {
		if (!browser) return;

		// Small delay to ensure DOM is fully rendered
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			// Check container dimensions
			const containerWidth = graphContainer.clientWidth;
			const containerHeight = graphContainer.clientHeight;

			// Use fallback dimensions if container hasn't rendered properly
			const width = containerWidth > 0 ? containerWidth : browser ? window.innerWidth : 1920;
			const height = containerHeight > 0 ? containerHeight : browser ? window.innerHeight : 1080;

			// Dynamic import to avoid SSR issues
			const { default: ForceGraph3D } = await import('3d-force-graph');

			// Initialize with optimized data and settings
			forceGraphInstance = new ForceGraph3D(graphContainer, { controlType: 'orbit' })
				.graphData(graphData)
				.nodeId('id')
				.nodeLabel('label') // Use pre-computed labels
				.nodeVal('val') // Use pre-computed sizes
				.nodeColor('color') // Use pre-computed colors
				.nodeOpacity(0.9)
				.nodeResolution(8) // Balanced resolution
				.nodeRelSize(4)
				// Use ngraph for better performance with good clustering
				.forceEngine('ngraph')
				.ngraphPhysics({
					springLength: 100,
					springCoefficient: 0.0005,
					gravity: -0.8,
					theta: 0.8,
					dragCoefficient: 0.01,
					timeStep: 20
				})
				// Optimize link rendering while maintaining visibility
				.linkWidth(0) // Use 1px lines for performance
				.linkColor(() => 'rgba(150,150,150,0.6)')
				.linkOpacity(0.4)
				// Canvas settings - use computed dimensions
				.backgroundColor(backgroundColor)
				.width(width)
				.height(height)
				// Interactions
				.enablePointerInteraction(true)
				.enableNodeDrag(false) // Disable for performance with many nodes
				.enableNavigationControls(true)
				.showNavInfo(false)
				// Performance settings - let physics run longer for better layout
				.warmupTicks(50) // Some warmup for initial positioning
				.cooldownTicks(500)
				.cooldownTime(20000)
				// Event handlers
				.onNodeHover(handleNodeHover)
				.onNodeClick(handleNodeClick)
				.enableNavigationControls(true);

			isInitialized = true;
			// after init, tune the controls a bit
			const controls: any = forceGraphInstance.controls();
			controls.enableDamping = true;
			controls.dampingFactor = 0.1;
			controls.screenSpacePanning = true; // right-drag pans "under the cursor"
			controls.minDistance = 50;
			controls.maxDistance = 8000;
			// Some three.js versions support this; safe to gate it:
			if ('zoomToCursor' in controls) controls.zoomToCursor = true;
		} catch (err) {
			// console.error('Error initializing graph:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize graph';
		}
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (forceGraphInstance) {
				if (forceGraphInstance._destructor) {
					forceGraphInstance._destructor();
				}
				forceGraphInstance = null;
			}
		};
	});

	// Skip automatic resizing for now to avoid color parsing issues
	// TODO: Investigate why .width()/.height() calls trigger color re-parsing

	// Reactive updates for background color
	$effect(() => {
		if (browser && isInitialized && forceGraphInstance) {
			forceGraphInstance.backgroundColor(backgroundColor);
		}
	});
</script>

<!-- Root wrapper -->
<div class="relative h-full w-full">
	<!-- Graph container with mouse tracking -->
	<div
		bind:this={graphContainer}
		class="relative h-full w-full"
		onmousemove={handleMouseMove}
	>
		{#if error}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="preset-filled-error-800-200 rounded-lg p-6">
					<h3 class="h3">Graph Error</h3>
					<p>{error}</p>
				</div>
			</div>
		{:else if !browser || !isInitialized}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="preset-filled-surface-100-900 rounded-lg p-6">
					<h3 class="h3">Loading Graph...</h3>
					<p class="mt-2">Initializing {graphData.metadata.total_nodes} nodes...</p>
				</div>
			</div>
		{:else}
			<!-- Graph info overlay -->
			<div class="absolute top-2 left-2 z-10">
				<div class="preset-filled-surface-100-900 rounded-lg p-2 opacity-80">
					<p class="text-sm">
						Nodes: {graphData.metadata.total_nodes} | Links: {graphData.metadata.total_links}
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Single reactive tooltip that follows mouse - outside container -->
	{#if tooltipContent.show}
		<div
			class="pointer-events-none fixed z-[9999]"
			style="left: {tooltipPosition.x + 15}px; top: {tooltipPosition.y - 10}px;"
		>
			<div class="preset-filled-surface-100-900 max-w-sm card border border-surface-400 p-4 shadow-xl">
				<header class="card-header pb-2">
					<h4 class="text-on-surface h4 font-semibold">{tooltipContent.name}</h4>
				</header>
				<section class="card-body space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm opacity-75">Category:</span>
						<span class="text-sm font-medium">{tooltipContent.category}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm opacity-75">Subscribers:</span>
						<span class="text-sm font-medium">{tooltipContent.subscriberText}</span>
					</div>
					{#if tooltipContent.isBestseller}
						<div class="pt-2">
							<span class="bg-orange-500 badge">Bestseller</span>
						</div>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>


