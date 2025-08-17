<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Component props using Svelte 5 runes
	let {
		graphData,
		categoryStats,
		backgroundColor = '#000000'
	}: {
		graphData: { nodes: any[]; links: any[]; metadata: any };
		categoryStats: any[];
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

	// Create a map for quick category stats lookup
	let categoryStatsMap = $derived(() => {
		const map = new Map();
		categoryStats?.forEach(cat => {
			map.set(`category_${cat.category}`, cat);
		});
		return map;
	});

	// Track mouse position for tooltip
	function handleMouseMove(event: MouseEvent) {
		if (hoveredNode) {
			tooltipPosition = { x: event.clientX, y: event.clientY };
		}
	}

	// Derive tooltip content reactively with category stats
	let tooltipContent = $derived(
		(() => {
			if (!hoveredNode) return { show: false };
			
			const stats = categoryStatsMap.get(hoveredNode.id);
			const medianSubs = stats?.median_subscriber_count || 0;
			const meanSubs = stats?.mean_subscriber_count || 0;
			const maxSubs = stats?.max_subscriber_count || 0;
			const outgoing = stats?.outgoing || hoveredNode?.outgoing_connections || 0;
			const incoming = stats?.incoming || hoveredNode?.incoming_connections || 0;
			
			return {
				show: true,
				name: hoveredNode?.name || '',
				medianText: medianSubs >= 1000 
					? `${Math.round(medianSubs / 1000)}k median` 
					: `${Math.round(medianSubs)} median`,
				meanText: meanSubs >= 1000 
					? `${Math.round(meanSubs / 1000)}k average` 
					: `${Math.round(meanSubs)} average`,
				maxText: maxSubs >= 1000 
					? `${Math.round(maxSubs / 1000)}k max` 
					: `${Math.round(maxSubs)} max`,
				outgoingConnections: outgoing,
				incomingConnections: incoming,
				totalConnections: hoveredNode?.inDegree + hoveredNode?.outDegree || 0
			};
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
		const distance = Math.max(40, (forceGraphInstance.getGraphBbox()?.x[1] ?? 200) * 0.3);
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
		console.log('Category node clicked:', node.name, node);
		focusNode(node, 800);
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
			const SpriteText = await import('three-spritetext');

			// Initialize with d3 engine for draggable nodes
			forceGraphInstance = new ForceGraph3D(graphContainer, { controlType: 'orbit' })
				.graphData(graphData)
				.nodeId('id')
				.nodeLabel('label')
				.nodeVal('val')
				// Use SpriteText to display category names as text-only nodes
				.nodeThreeObject((node: any) => {
					const sprite = new SpriteText.default(node.name || node.id);
					sprite.material.depthWrite = false; // make sprite background transparent
					sprite.color = node.color || '#ffffff';
					sprite.textHeight = 8;
					return sprite;
				})
				// Use d3 force engine to enable node dragging
				.forceEngine('d3')
				.d3AlphaDecay(0.01) // Even slower decay for better settling
				.d3VelocityDecay(0.3) // Reduced damping for more movement
				.numDimensions(2)
				// Link styling
				.linkWidth((link: any) => Math.sqrt(link.value || 1) * 0.3)
				.linkColor(() => 'rgba(150,150,255,0.4)')
				.linkOpacity(0.2)
				// Canvas settings
				.backgroundColor(backgroundColor)
				.width(width)
				.height(height)
				// Enable interactions
				.enablePointerInteraction(true)
				.enableNodeDrag(true) // Enable dragging with d3 engine
				.enableNavigationControls(true)
				.showNavInfo(false)
				// Physics settings
				.warmupTicks(50)
				.cooldownTicks(200)
				.cooldownTime(10000)
				// Event handlers
				.onNodeHover(handleNodeHover)
				.onNodeClick(handleNodeClick)
				.onNodeDragEnd((node: any) => {
					// Pin node position after dragging (2D only)
					node.fx = node.x;
					node.fy = node.y;
					// Don't set fz since we're in 2D mode
				});

			// Configure d3 forces for better node spacing after initialization
			const linkForce = forceGraphInstance.d3Force('link');
			if (linkForce) {
				linkForce.distance(400).strength(0.1); // Increased distance, reduced strength
			}
			
			const chargeForce = forceGraphInstance.d3Force('charge');
			if (chargeForce) {
				chargeForce.strength(-400).distanceMax(600); // Stronger repulsion, larger range
			}
			
			const centerForce = forceGraphInstance.d3Force('center');
			if (centerForce) {
				centerForce.strength(0.05); // Weaker centering force
			}

			isInitialized = true;
			
			// Set initial camera position for 2D view
			setTimeout(() => {
				const bbox = forceGraphInstance.getGraphBbox();
				if (bbox) {
					// Position camera directly above for 2D view
					const distance = Math.max(800, Math.max(bbox.x[1] - bbox.x[0], bbox.y[1] - bbox.y[0]) * 1.5);
					forceGraphInstance.cameraPosition(
						{ x: 0, y: 0, z: distance },
						{ x: 0, y: 0, z: 0 },
						1000
					);
				}
			}, 500);
			
			// Tune the controls for 2D-like navigation
			const controls: any = forceGraphInstance.controls();
			controls.enableDamping = true;
			controls.dampingFactor = 0.1;
			controls.screenSpacePanning = true;
			controls.minDistance = 200; // Minimum distance for 2D view
			controls.maxDistance = 5000; // Maximum distance
			
			// Constrain rotation for 2D-like behavior
			controls.maxPolarAngle = Math.PI * 0.1; // Limit vertical rotation (almost top-down)
			controls.minPolarAngle = 0; // Prevent going below horizontal
			
			if ('zoomToCursor' in controls) controls.zoomToCursor = true;
		} catch (err) {
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
					<h3 class="h3">Loading Category Network...</h3>
					<p class="mt-2">Initializing {graphData.metadata.total_nodes} categories...</p>
				</div>
			</div>
		{:else}
			<!-- Graph info overlay -->
			<div class="absolute top-2 left-2 z-10">
				<div class="preset-filled-surface-100-900 rounded-lg p-3 opacity-90">
					<p class="text-sm font-medium">
						Categories: {graphData.metadata.categories_count}
					</p>
					<p class="text-xs opacity-75 mt-1">
						Connections: {graphData.metadata.total_links} | Drag nodes to interact
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Enhanced tooltip for categories -->
	{#if tooltipContent.show}
		<div
			class="pointer-events-none fixed z-[9999]"
			style="left: {tooltipPosition.x + 15}px; top: {tooltipPosition.y - 10}px;"
		>
			<div class="preset-filled-surface-100-900 max-w-sm card border border-surface-400 p-4 shadow-xl">
				<header class="card-header pb-2">
					<h4 class="text-on-surface h4 font-semibold">{tooltipContent.name}</h4>
				</header>
				<section class="card-body space-y-3">
					<!-- Subscriber Statistics -->
					<div class="space-y-1">
						<div class="text-xs font-semibold opacity-75 uppercase">Subscriber Stats</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Median:</span>
							<span class="text-sm font-medium">{tooltipContent.medianText}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Average:</span>
							<span class="text-sm font-medium">{tooltipContent.meanText}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Maximum:</span>
							<span class="text-sm font-medium">{tooltipContent.maxText}</span>
						</div>
					</div>
					
					<!-- Connection Statistics -->
					<div class="space-y-1 pt-2 border-t border-surface-500">
						<div class="text-xs font-semibold opacity-75 uppercase">Connections</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Recommendations to:</span>
							<span class="text-sm font-medium">{tooltipContent.outgoingConnections}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Recommendations from:</span>
							<span class="text-sm font-medium">{tooltipContent.incomingConnections}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm opacity-75">Graph connections:</span>
							<span class="text-sm font-medium">{tooltipContent.totalConnections}</span>
						</div>
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>