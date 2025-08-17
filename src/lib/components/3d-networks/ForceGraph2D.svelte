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

	// Hover + click handlers
	const handleNodeHover = (node: any) => {
		hoveredNode = node;
	};

	// Smooth focus: pan in XY, keep current altitude (z)
	const focusNode = (node: any, ms = 800) => {
		if (!node || !forceGraphInstance) return;

		const cam: any = forceGraphInstance.camera?.();
		const z = cam?.position?.z ?? 300;
		const x = node.x ?? 0;
		const y = node.y ?? 0;

		forceGraphInstance.cameraPosition(
			{ x, y, z },      // keep same altitude
			{ x, y, z: 0 },   // look at the node on the XY plane
			ms
		);

		const ctrls: any = forceGraphInstance.controls?.();
		if (ctrls?.target?.set) {
			ctrls.target.set(x, y, 0);
			ctrls.update?.();
		}
	};

	const handleNodeClick = (node: any) => {
		console.log('Node clicked:', node?.name ?? node?.id, node);
		focusNode(node, 800);
	};

	// Component lifecycle - onMount
	onMount(async () => {
		if (!browser) return;

		// Small delay to ensure DOM is fully rendered
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			// Check container dimensions
			const containerWidth = graphContainer?.clientWidth ?? 0;
			const containerHeight = graphContainer?.clientHeight ?? 0;

			// Use fallback dimensions if container hasn't rendered properly
			const width = containerWidth > 0 ? containerWidth : (browser ? window.innerWidth : 1920);
			const height = containerHeight > 0 ? containerHeight : (browser ? window.innerHeight : 1080);

			// Dynamic imports to avoid SSR issues
			const ForceGraph3D = (await import('3d-force-graph')).default;
			const threeMod = await import('three'); // for MOUSE/TOUCH enums
			const MOUSE = (threeMod as any).MOUSE;
			const TOUCH = (threeMod as any).TOUCH;

			// Initialize with your existing settings, flattened to 2D
			forceGraphInstance = new ForceGraph3D(graphContainer, { controlType: 'orbit' })
				.graphData(graphData)
				.nodeId('id')
				.nodeLabel('label') // Use pre-computed labels
				.nodeVal('val')     // Use pre-computed sizes
				.nodeColor('color') // Use pre-computed colors
				.nodeOpacity(0.9)
				.nodeResolution(8)
				.nodeRelSize(4)

				// ---- 2D MODE (physics + render plane) ----
				.numDimensions(2) // run physics in 2D
				.nodePositionUpdate((obj: any, coords: {x:number;y:number;z:number}) => {
					// lock every node to z=0 for a true flat view
					obj.position.set(coords?.x ?? 0, coords?.y ?? 0, 0);
					return true; // skip default updater
				})

				// Physics (ngraph) same as your 3D version
				.forceEngine('ngraph')
				.ngraphPhysics({
					springLength: 100,
					springCoefficient: 0.0005,
					gravity: -0.8,
					theta: 0.8,
					dragCoefficient: 0.01,
					timeStep: 20
				})

				// Links
				.linkWidth(0) // 1px Lines (ThreeJS Line) for performance
				.linkColor(() => 'rgba(150,150,150,0.6)')
				.linkOpacity(0.4)

				// Canvas settings
				.backgroundColor(backgroundColor)
				.width(width)
				.height(height)

				// Interactions
				.enablePointerInteraction(true)
				.enableNodeDrag(false) // ngraph doesn't support node drag
				.enableNavigationControls(true)
				.showNavInfo(false)

				// Performance
				.warmupTicks(50)
				.cooldownTicks(500)
				.cooldownTime(20000)

				// Events
				.onNodeHover(handleNodeHover)
				.onNodeClick(handleNodeClick);

			isInitialized = true;

			// Camera/controls: lock to top-down "2D" view, but allow panning on LEFT drag
			const ctrls: any = forceGraphInstance.controls?.();
			if (ctrls) {
				ctrls.enableDamping = true;
				ctrls.dampingFactor = 0.1;
				ctrls.screenSpacePanning = true;

				// Disable rotation and lock top-down angle
				ctrls.enableRotate = false;
				if ('minPolarAngle' in ctrls) {
					ctrls.minPolarAngle = Math.PI / 2;
					ctrls.maxPolarAngle = Math.PI / 2;
				}

				// ✅ Remap inputs so LEFT-DRAG pans (trackpads feel natural)
				if (ctrls.mouseButtons && MOUSE) {
					ctrls.mouseButtons.LEFT = MOUSE.PAN;
					ctrls.mouseButtons.MIDDLE = MOUSE.DOLLY;
					ctrls.mouseButtons.RIGHT = MOUSE.PAN;
				}
				// ✅ Touch: one-finger pan, two-finger dolly/pan
				if (ctrls.touches && TOUCH) {
					ctrls.touches.ONE = TOUCH.PAN;
					ctrls.touches.TWO = TOUCH.DOLLY_PAN;
				}

				ctrls.minDistance = 50;
				ctrls.maxDistance = 8000;
				if ('zoomToCursor' in ctrls) ctrls.zoomToCursor = true;
			}

			// Position camera above the graph (top-down) at a sensible distance
			const bbox = forceGraphInstance.getGraphBbox();
			const sizeX = bbox?.x ? bbox.x[1] - bbox.x[0] : 100;
			const sizeY = bbox?.y ? bbox.y[1] - bbox.y[0] : 100;
			const dist = Math.max(sizeX, sizeY) * 1.2 || 300;

			forceGraphInstance.cameraPosition(
				{ x: 0, y: 0, z: dist },
				{ x: 0, y: 0, z: 0 },
				0
			);

			ctrls?.target?.set(0, 0, 0);
			ctrls?.update?.();

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
		role="application"
		aria-label="Interactive 2D network graph (flattened 3D)"
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
						2D View (flattened) | Nodes: {graphData.metadata.total_nodes} | Links: {graphData.metadata.total_links}
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
