<script lang="ts">
	import type { NetworkGraphProps, LayoutConfig } from './types';
	import { processPublications, createEdges } from './data';

	// Component props using Svelte 5 runes
	let { publications, recommendations, width = 800, height = 600 }: NetworkGraphProps = $props();

	// Interaction state using Svelte 5 runes
	let hoveredNode = $state<string | null>(null);

	// Layout configuration
	const layoutConfig: LayoutConfig = {
		nodeRadius: 4,
		horizontalSpacing: 200,
		verticalSpacing: 20,
		edgeCurvature: 0.2,
		margins: {
			top: 60,
			right: 150,
			bottom: 40,
			left: 150
		}
	};

	// Calculate adaptive height based on node count
	let adaptiveHeight = $derived.by(() => {
		const maxNodesPerSide = Math.max(
			publications.filter(p => p.is_bestseller).length,
			recommendations.length
		);
		// Base height + additional height per node
		const minHeight = 400;
		const heightPerNode = 25;
		const calculatedHeight = Math.max(minHeight, layoutConfig.margins.top + layoutConfig.margins.bottom + (maxNodesPerSide * heightPerNode));
		return Math.min(calculatedHeight, 1200); // Cap at 1200px
	});

	// Derived calculations for responsive viewBox
	let viewBoxWidth = $derived(width);
	let viewBoxHeight = $derived(adaptiveHeight);
	let viewBox = $derived(`0 0 ${viewBoxWidth} ${viewBoxHeight}`);

	// Process publications into nodes using existing data processing functions
	let processedNodes = $derived(
		processPublications(publications, recommendations, viewBoxWidth, viewBoxHeight)
	);

	// Apply vertical spacing adjustment to prevent overlaps
	let adjustedNodes = $derived.by(() => {
		if (processedNodes.length === 0) return [];
		
		// Group nodes by side and adjust vertical spacing if needed
		const leftNodes = processedNodes.filter(n => n.side === 'left');
		const rightNodes = processedNodes.filter(n => n.side === 'right');
		
		// Calculate minimum spacing needed
		const minSpacing = layoutConfig.nodeRadius * 2.5;
		
		// Adjust left side nodes
		const adjustedLeft = adjustVerticalSpacing(leftNodes, minSpacing, viewBoxHeight);
		
		// Adjust right side nodes  
		const adjustedRight = adjustVerticalSpacing(rightNodes, minSpacing, viewBoxHeight);
		
		return [...adjustedLeft, ...adjustedRight];
	});
	
	// Helper function to adjust vertical spacing
	function adjustVerticalSpacing(nodes: typeof processedNodes, minSpacing: number, height: number) {
		if (nodes.length <= 1) return nodes;
		
		const sorted = [...nodes].sort((a, b) => a.y - b.y);
		const adjusted = [...sorted];
		
		// Check and adjust spacing
		for (let i = 1; i < adjusted.length; i++) {
			const prevNode = adjusted[i - 1];
			const currNode = adjusted[i];
			const spacing = currNode.y - prevNode.y;
			
			if (spacing < minSpacing) {
				// Adjust current node position
				adjusted[i] = {
					...currNode,
					y: prevNode.y + minSpacing
				};
			}
		}
		
		// Center the group vertically if needed
		const totalHeight = adjusted[adjusted.length - 1].y - adjusted[0].y;
		if (totalHeight < height * 0.8) {
			const offset = (height - totalHeight) / 2 - adjusted[0].y;
			return adjusted.map(node => ({
				...node,
				y: node.y + offset
			}));
		}
		
		return adjusted;
	}

	// Final layout with adjusted positions and updated edges
	let layout = $derived.by(() => {
		// Create edges using the adjusted node positions
		const updatedEdges = createEdges(recommendations, adjustedNodes);
		
		return {
			nodes: adjustedNodes,
			edges: updatedEdges,
			width: viewBoxWidth,
			height: viewBoxHeight
		};
	});
</script>

<!-- Main NetworkGraph component with responsive SVG container -->
<div class="network-graph-container w-full" style="height: {adaptiveHeight}px; max-height: 80vh; overflow-y: auto;">
	<svg
		width="100%"
		height={adaptiveHeight}
		{viewBox}
		class="border-surface-400-600/10 h-auto w-full rounded-lg border"
		role="img"
		aria-label="Network graph visualization of newsletter publications and recommendations"
	>

		<!-- Left side label (Bestsellers) -->
		<text
			x={viewBoxWidth * 0.25}
			y={30}
			class="fill-surface-900-100 text-base font-semibold"
			text-anchor="middle"
		>
			Bestsellers ({publications.filter((p) => p.is_bestseller).length})
		</text>

		<!-- Right side label (Recommendations) -->
		<text
			x={viewBoxWidth * 0.75}
			y={30}
			class="fill-surface-900-100 text-base font-semibold"
			text-anchor="middle"
		>
			Recommendations ({layout.nodes.filter(n => n.side === 'right').length})
		</text>

		<!-- Edges group -->
		<g class="edges" aria-label="Recommendation connections">
			{#each layout.edges as edge}
				<path
					d={edge.path}
					class="cursor-pointer fill-none transition-all duration-200
                 {hoveredNode === edge.source.id || hoveredNode === edge.target.id
						? 'stroke-primary-500 stroke-opacity-90'
						: 'stroke-surface-400 stroke-opacity-30'}"
					stroke-width={hoveredNode === edge.source.id || hoveredNode === edge.target.id ? 2 : 1}
					role="button"
					tabindex="0"
					aria-label="Connection from {edge.source.name} to {edge.target.name}"
					onmouseenter={() => {
						hoveredNode = edge.source.id;
					}}
					onmouseleave={() => (hoveredNode = null)}
				/>
			{/each}
		</g>

		<!-- Nodes group -->
		<g class="nodes" aria-label="Publication nodes">
			{#each layout.nodes as node}
				<g
					class="node {node.nodeType}-node"
					transform="translate({node.x}, {node.y})"
					role="button"
					tabindex="0"
					aria-label="{node.nodeType === 'dual'
						? 'Dual-role'
						: node.nodeType}: {node.name}{node.subscriber_count !== null && node.subscriber_count > 0 ? ` (${node.subscriber_count.toLocaleString()} subscribers)` : ''}"
				>
					<circle
						r={layoutConfig.nodeRadius}
						class="{node.nodeType === 'bestseller'
							? 'fill-primary-500 stroke-primary-700'
							: node.nodeType === 'dual'
								? 'fill-tertiary-500 stroke-tertiary-700'
								: 'fill-secondary-500 stroke-secondary-700'} cursor-pointer stroke-2
                   {hoveredNode === node.id ? 'fill-opacity-80' : 'fill-opacity-100'}"
						role="button"
						tabindex="0"
						onmouseenter={() => (hoveredNode = node.id)}
						onmouseleave={() => (hoveredNode = null)}
					/>
					<text
						x={node.side === 'left' ? -layoutConfig.nodeRadius - 5 : layoutConfig.nodeRadius + 5}
						y="0"
						dy="0.35em"
						class="pointer-events-none text-xs {hoveredNode === node.id ? 'fill-surface-900 font-semibold' : 'fill-surface-700 font-medium'}"
						text-anchor={node.side === 'left' ? 'end' : 'start'}
					>
						{node.name.length > 25 ? node.name.substring(0, 25) + '...' : node.name}
					</text>

					<!-- Subscriber count indicator for bestsellers and dual-role nodes -->
					{#if (node.nodeType === 'bestseller' || node.nodeType === 'dual') && hoveredNode === node.id}
						<text
							x={node.side === 'left' ? -layoutConfig.nodeRadius - 5 : layoutConfig.nodeRadius + 5}
							y="14"
							dy="0.35em"
							class="fill-surface-600 pointer-events-none text-[10px]"
							text-anchor={node.side === 'left' ? 'end' : 'start'}
						>
							{node.subscriber_count !== null && node.subscriber_count > 0 ? node.subscriber_count.toLocaleString() + ' subscribers' : 'No subscriber data'}
						</text>
					{/if}
				</g>
			{/each}
		</g>

		<!-- Layout info display -->
		<text
			x={viewBoxWidth / 2}
			y={viewBoxHeight - 20}
			text-anchor="middle"
			class="fill-surface-600-300-token text-xs"
		>
			{layout.nodes.length} nodes • {layout.edges.length} connections
		</text>
	</svg>
</div>
