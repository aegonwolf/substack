<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { 
    Publication, 
    Recommendation, 
    ForceGraph3DProps,
    NodeClickHandler,
    NodeHoverHandler,
    LinkClickHandler,
    GraphData,
    GraphNode,
    GraphLink
  } from '../3d-networks/types.js';

  // Component props using Svelte 5 runes
  let { 
    publications,
    recommendations,
    width = 800,
    height = 600,
    backgroundColor = '#000011',
    nodeAutoColorBy = 'category',
    linkAutoColorBy = 'category'
  }: ForceGraph3DProps = $props();

  // Component state using Svelte 5 runes
  let graphContainer: HTMLDivElement = $state()!;
  let forceGraphInstance = $state<any>(null);
  let isInitialized = $state(false);
  let error = $state<string | null>(null);

  // Pre-compute all node properties once
  function createOptimizedGraphData(pubs: Publication[], recs: Recommendation[]): GraphData {
    // Pre-calculate subscriber count statistics for normalization
    const subscriberCounts = pubs
      .map(p => p.subscriber_count)
      .filter(c => c !== null && c !== undefined) as number[];
    
    const maxSubscribers = Math.max(...subscriberCounts, 1);
    const minSubscribers = Math.min(...subscriberCounts, 0);
    
    // Pre-compute nodes with all visual properties
    const nodes: GraphNode[] = pubs.map(pub => {
      const subscriberCount = pub.subscriber_count || (pub.is_bestseller ? 50000 : 10000);
      
      // Pre-compute size with normalized scaling
      const normalizedCount = (subscriberCount - minSubscribers) / (maxSubscribers - minSubscribers);
      const nodeSize = 2 + (normalizedCount * 13); // Size range: 2-15
      
      // Pre-compute color
      let color: string;
      if (pub.is_bestseller) {
        color = '#ff6b35'; // Orange for bestsellers
      } else if (subscriberCount > 50000) {
        color = '#4ecdc4'; // Teal
      } else if (subscriberCount > 10000) {
        color = '#45b7d1'; // Blue
      } else {
        color = '#96ceb4'; // Light green
      }
      
      return {
        id: pub.id,
        name: pub.name,
        category: pub.category,
        subscriber_count: subscriberCount,
        is_bestseller: pub.is_bestseller,
        val: nodeSize,
        color: color,
        // Pre-compute simple label (not HTML for performance)
        __label: `${pub.name} (${subscriberCount >= 1000 ? Math.round(subscriberCount / 1000) + 'k' : subscriberCount})`
      };
    });

    // Simple link creation
    const links: GraphLink[] = recs.map(rec => ({
      source: rec.recommender_id,
      target: rec.recommended_id,
      color: '#999999'
    }));

    return { nodes, links };
  }

  // Create graph data once on initialization
  let graphData = $state<GraphData | null>(null);
  
  // Initialize graph data when props are available
  $effect(() => {
    if (publications?.length && recommendations?.length && !graphData) {
      console.log('Creating optimized graph data for', publications.length, 'nodes');
      graphData = createOptimizedGraphData(publications, recommendations);
    }
  });

  // Simplified hover state
  let hoveredNode = $state<GraphNode | null>(null);

  // Event handlers
  const handleNodeClick: NodeClickHandler = (node) => {
    console.log('Node clicked:', node);
  };

  const handleNodeHover: NodeHoverHandler = (node, prevNode) => {
    hoveredNode = node;
  };

  const handleLinkClick: LinkClickHandler = (link) => {
    console.log('Link clicked:', link);
  };

  // Component lifecycle - onMount
  onMount(async () => {
    if (!browser || !graphData) return;

    try {
      console.log('Initializing optimized ForceGraph3D');
      
      // Dynamic import of 3d-force-graph to avoid SSR issues
      const { default: ForceGraph3D } = await import('3d-force-graph');
      
      // Initialize with optimized settings for 20k nodes
      forceGraphInstance = new ForceGraph3D(graphContainer)
        .graphData(graphData)
        .nodeId('id')
        .nodeLabel('__label') // Use pre-computed simple labels
        .nodeVal('val')
        .nodeColor('color')
        .nodeOpacity(0.75)
        .nodeResolution(8) // Lower resolution for performance with 20k nodes
        .nodeRelSize(4)
        .linkSource('source')
        .linkTarget('target')
        .linkColor('color')
        .linkOpacity(0.2)
        .linkWidth(0.5)
        .linkDirectionalArrowLength(0) // Disable arrows for performance
        .backgroundColor(backgroundColor)
        .width(width)
        .height(height)
        .showNavInfo(false) // Disable nav info for performance
        .enablePointerInteraction(true)
        .enableNodeDrag(false) // Disable drag for better performance with 20k nodes
        // Performance optimizations
        .warmupTicks(50) // Reduced warmup
        .cooldownTicks(100) // Stop simulation earlier
        .cooldownTime(5000) // Stop after 5 seconds max
        // Force configuration for better layout with many nodes
        .d3AlphaDecay(0.0228 * 2) // Faster cooling
        .d3VelocityDecay(0.5) // More damping
        .dagMode(null) // Ensure DAG mode is off
        .numDimensions(3);

      // Configure forces for better distribution
      if (forceGraphInstance.d3Force) {
        // Weaker charge for performance
        forceGraphInstance.d3Force('charge').strength(-30);
        // Shorter links
        forceGraphInstance.d3Force('link').distance(30);
        // Weaker centering
        forceGraphInstance.d3Force('center').strength(0.05);
      }

      // Set up event handlers
      forceGraphInstance
        .onNodeClick(handleNodeClick)
        .onNodeHover(handleNodeHover)
        .onLinkClick(handleLinkClick);

      console.log('Optimized 3D Force Graph initialized');
      isInitialized = true;
      
    } catch (err) {
      console.error('Error initializing 3D force graph:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    }
  });

  // Component lifecycle - onDestroy
  onDestroy(() => {
    if (forceGraphInstance) {
      if (forceGraphInstance._destructor) {
        forceGraphInstance._destructor();
      }
      forceGraphInstance = null;
    }
    isInitialized = false;
  });

  // Single reactive update for dimension changes only
  $effect(() => {
    if (browser && isInitialized && forceGraphInstance) {
      forceGraphInstance.width(width).height(height);
    }
  });
</script>

<!-- DOM container element for 3D graph mounting -->
<div 
  bind:this={graphContainer}
  class="force-graph-3d-container"
  style="width: {width}px; height: {height}px; position: relative;"
>
  {#if error}
    <div class="error-message variant-filled-error p-4 rounded-lg">
      <h3 class="h3">3D Graph Error</h3>
      <p>{error}</p>
    </div>
  {:else if !browser}
    <div class="loading-message variant-filled-surface p-4 rounded-lg">
      <h3 class="h3">3D Graph</h3>
      <p>Loading 3D visualization...</p>
    </div>
  {:else if !isInitialized}
    <div class="loading-message variant-filled-surface p-4 rounded-lg">
      <h3 class="h3">Loading 3D Graph...</h3>
      <p>Initializing {publications.length} nodes...</p>
    </div>
  {:else}
    <div class="graph-info variant-filled-surface p-2 rounded-lg absolute top-2 left-2 z-10">
      <p class="text-sm">
        Nodes: {publications.length} | Links: {recommendations.length}
      </p>
    </div>
    
    <!-- Simplified tooltip -->
    {#if hoveredNode}
      <div 
        class="node-tooltip variant-filled-primary p-2 rounded absolute z-20 pointer-events-none"
        style="left: 10px; bottom: 10px; max-width: 250px;"
      >
        <strong>{hoveredNode.name}</strong>
        {#if hoveredNode.subscriber_count}
          <span class="text-sm ml-2">({hoveredNode.subscriber_count.toLocaleString()} subs)</span>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .force-graph-3d-container {
    border: 1px solid var(--color-surface-300);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .error-message,
  .loading-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }
  
  .graph-info {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  .node-tooltip {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    font-size: 0.875rem;
  }
</style>