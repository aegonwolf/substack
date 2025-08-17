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
    linkAutoColorBy = 'category',
    maxNodes = 5000,
    sampleData = true,
    useOptimizedData = null // Pass pre-optimized data to skip transformations
  }: ForceGraph3DProps & { 
    maxNodes?: number, 
    sampleData?: boolean,
    useOptimizedData?: any 
  } = $props();

  // Component state using Svelte 5 runes
  let graphContainer: HTMLDivElement = $state()!;
  let forceGraphInstance = $state<any>(null);
  let isInitialized = $state(false);
  let error = $state<string | null>(null);

  // Node visual configuration functions
  function calculateNodeSize(subscriberCount: number): number {
    // Map subscriber count to node size with minimum and maximum bounds
    const minSize = 2;
    const maxSize = 15;
    const normalizedSize = Math.sqrt(subscriberCount / 1000);
    return Math.max(minSize, Math.min(maxSize, normalizedSize));
  }

  function getNodeColor(publication: Publication): string {
    // Color coding: bestsellers get warm colors, regular publications get cool colors
    if (publication.is_bestseller) {
      return '#ff6b35'; // Orange for bestsellers
    } else {
      // Use different shades based on subscriber count when available, otherwise bestseller status
      if (publication.subscriber_count !== null) {
        if (publication.subscriber_count > 50000) {
          return '#4ecdc4'; // Teal for high subscriber count
        } else if (publication.subscriber_count > 10000) {
          return '#45b7d1'; // Blue for medium subscriber count
        } else {
          return '#96ceb4'; // Light green for lower subscriber count
        }
      } else if (publication.is_bestseller) {
        return '#4ecdc4'; // Teal for bestsellers without subscriber data
      } else {
        return '#96ceb4'; // Light green for lower subscriber count
      }
    }
  }

  // Data transformation functions with sampling support
  function transformToGraphData(pubs: Publication[], recs: Recommendation[]): GraphData {
    // Sample data if too large
    let sampledPubs = pubs;
    let sampledRecs = recs;
    
    if (sampleData && pubs.length > maxNodes) {
      console.log(`Sampling ${maxNodes} nodes from ${pubs.length} total`);
      
      // Prioritize bestsellers and high subscriber counts
      const sorted = [...pubs].sort((a, b) => {
        if (a.is_bestseller !== b.is_bestseller) return a.is_bestseller ? -1 : 1;
        return (b.subscriber_count || 0) - (a.subscriber_count || 0);
      });
      
      sampledPubs = sorted.slice(0, maxNodes);
      const pubIds = new Set(sampledPubs.map(p => p.id));
      
      // Only keep recommendations between sampled nodes
      sampledRecs = recs.filter(r => 
        pubIds.has(r.recommender_id) && pubIds.has(r.recommended_id)
      );
    }
    // Transform publications to graph nodes with enhanced visual properties
    const nodes: GraphNode[] = sampledPubs.map(pub => ({
      id: pub.id,
      name: pub.name,
      category: pub.category,
      subscriber_count: pub.subscriber_count,
      is_bestseller: pub.is_bestseller,
      val: calculateNodeSize(pub.subscriber_count || (pub.is_bestseller ? 50000 : 10000)), // Use real subscriber count or fallback
      color: getNodeColor(pub)
    }));

    // Transform recommendations to graph links
    const links: GraphLink[] = sampledRecs.map(rec => ({
      source: rec.recommender_id,
      target: rec.recommended_id,
      color: '#999999'
    }));

    return { nodes, links };
  }

  // Use optimized data if provided, otherwise transform
  let graphData = $state<GraphData | null>(null);
  
  // Update graph data when props change
  $effect(() => {
    if (useOptimizedData) {
      console.log('Using pre-optimized graph data');
      graphData = useOptimizedData;
    } else if (publications && recommendations) {
      console.log('Transforming publications/recommendations to graph data');
      graphData = transformToGraphData(publications, recommendations);
    }
  });

  // Single reactive tooltip state
  let hoveredNode = $state<GraphNode | null>(null);
  
  // Derive tooltip content reactively
  let tooltipContent = $derived({
    show: hoveredNode !== null,
    name: hoveredNode?.name || '',
    category: hoveredNode?.category || '',
    subscriberText: hoveredNode?.subscriber_count 
      ? `${hoveredNode.subscriber_count.toLocaleString()} subscribers`
      : '',
    isBestseller: hoveredNode?.is_bestseller || false
  });

  // Node label configuration function
  function getNodeLabel(node: GraphNode): string {
    // Display publication name with subscriber count when available
    if (node.subscriber_count !== null && node.subscriber_count > 0) {
      const subscriberText = node.subscriber_count >= 1000 
        ? `${Math.round(node.subscriber_count / 1000)}k subscribers`
        : `${node.subscriber_count} subscribers`;
      return `${node.name}\n${subscriberText}`;
    } else {
      const typeText = node.is_bestseller ? 'Bestseller' : 'Publication';
      return `${node.name}\n${typeText}`;
    }
  }



  // Event handlers
  const handleNodeClick: NodeClickHandler = (node) => {
    console.log('Node clicked:', node);
  };

  const handleNodeHover: NodeHoverHandler = (node, prevNode) => {
    // Simply update the single hoveredNode state
    hoveredNode = node;
  };

  const handleLinkClick: LinkClickHandler = (link) => {
    console.log('Link clicked:', link);
  };

  // Component lifecycle - onMount
  onMount(async () => {
    // Only initialize in browser environment
    if (!browser) {
      console.log('Skipping 3D graph initialization on server');
      return;
    }

    try {
      console.log('ForceGraph3D component mounted');
      console.log('Container element:', graphContainer);
      console.log('Publications:', publications.length);
      console.log('Recommendations:', recommendations.length);
      console.log('Graph data:', graphData);
      
      // Dynamic import of 3d-force-graph to avoid SSR issues
      const { default: ForceGraph3D } = await import('3d-force-graph');
      
      // Initialize ForceGraph3D instance with enhanced node visual properties and labeling
      forceGraphInstance = new ForceGraph3D(graphContainer)
        .graphData(graphData)
        .nodeId('id')
        .nodeLabel('name') // Simple property access, no function call per node
        .nodeVal('val')
        .nodeColor('color')
        .nodeOpacity(0.75) // Set node opacity for better visual depth
        .nodeResolution(graphData.nodes.length > 10000 ? 4 : 8) // Dynamic resolution based on node count
        .nodeRelSize(4) // Relative size scaling factor
        .nodeAutoColorBy(nodeAutoColorBy)
        .forceEngine('ngraph') // Use faster ngraph engine for large graphs
        .ngraphPhysics({
          springLength: 30,
          springCoefficient: 0.0008,
          gravity: -1.2,
          theta: 0.8,
          dragCoefficient: 0.02,
          timeStep: 20
        })
        // Enhanced node labeling for better 3D readability
        .nodeLabel((node: GraphNode) => {
          // Create rich HTML tooltip content for node labels
          return `<div style="
            background: rgba(0, 0, 0, 0.8); 
            color: white; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 12px; 
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            max-width: 200px;
            text-align: center;
          ">
            <strong>${node.name}</strong><br/>
            <span style="opacity: 0.9;">${node.subscriber_count !== null && node.subscriber_count > 0 ? node.subscriber_count.toLocaleString() + ' subscribers' : (node.is_bestseller ? 'Bestseller' : 'Publication')}</span><br/>
            <span style="opacity: 0.8; font-size: 10px;">${node.category}</span>
            ${node.is_bestseller ? '<br/><span style="color: #ff6b35;">⭐ Bestseller</span>' : ''}
          </div>`;
        })
        .linkSource('source')
        .linkTarget('target')
        .linkColor('color')
        .linkWidth(0) // Use ThreeJS Line (1px) instead of cylinders for performance
        .linkDirectionalArrowLength(0) // Disable arrows for performance with 20k nodes
        .linkDirectionalArrowRelPos(1)
        .backgroundColor(backgroundColor)
        .width(width)
        .height(height)
        .showNavInfo(true)
        .enablePointerInteraction(graphData.nodes.length < 10000) // Disable interaction for very large graphs
        .enableNodeDrag(graphData.nodes.length < 5000) // Only enable drag for smaller graphs
        // Dynamic performance optimizations based on node count
        .warmupTicks(0) // No warmup, start rendering immediately
        .cooldownTicks(graphData.nodes.length > 10000 ? 100 : 300) // Fewer ticks for large graphs
        .cooldownTime(graphData.nodes.length > 10000 ? 5000 : 10000) // Shorter time for large graphs
        .d3AlphaDecay(0.0228 * (graphData.nodes.length > 10000 ? 3 : 1.5)) // Much faster cooling for large graphs
        .d3VelocityDecay(graphData.nodes.length > 10000 ? 0.7 : 0.5) // More damping for large graphs
        .onEngineStop(() => {
          console.log('Physics simulation completed');
        });
        
      // Configure forces dynamically based on node count
      if (forceGraphInstance.d3Force) {
        const nodeCount = graphData.nodes.length;
        if (nodeCount > 10000) {
          // Very weak forces for huge graphs
          forceGraphInstance.d3Force('charge').strength(-20);
          forceGraphInstance.d3Force('link').distance(30).iterations(1);
          forceGraphInstance.d3Force('center').strength(0.01);
        } else if (nodeCount > 5000) {
          // Moderate forces for large graphs  
          forceGraphInstance.d3Force('charge').strength(-30);
          forceGraphInstance.d3Force('link').distance(40).iterations(1);
          forceGraphInstance.d3Force('center').strength(0.05);
        } else {
          // Normal forces for smaller graphs
          forceGraphInstance.d3Force('charge').strength(-50);
          forceGraphInstance.d3Force('link').distance(50);
        }
      }

      // Set up event handlers
      forceGraphInstance
        .onNodeClick(handleNodeClick)
        .onNodeHover(handleNodeHover)
        .onLinkClick(handleLinkClick);

      console.log('3D Force Graph initialized successfully');
      isInitialized = true;
      
    } catch (err) {
      console.error('Error initializing 3D force graph:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
    }
  });

  // Component lifecycle - onDestroy
  onDestroy(() => {
    try {
      console.log('ForceGraph3D component destroying');
      
      // Cleanup 3D resources
      if (forceGraphInstance) {
        // Call destructor if available
        if (forceGraphInstance._destructor) {
          forceGraphInstance._destructor();
        }
        forceGraphInstance = null;
      }
      
      isInitialized = false;
      
    } catch (err) {
      console.error('Error during component cleanup:', err);
    }
  });

  // Update graph only when initialized and data actually changes
  let previousDataLength = 0;
  $effect(() => {
    if (browser && isInitialized && forceGraphInstance && graphData) {
      const currentDataLength = graphData.nodes.length + graphData.links.length;
      if (currentDataLength !== previousDataLength) {
        console.log('Graph data updated - nodes:', graphData.nodes.length, 'links:', graphData.links.length);
        forceGraphInstance.graphData(graphData);
        previousDataLength = currentDataLength;
      }
    }
  });

  // Reactive updates for dimensions
  $effect(() => {
    if (browser && isInitialized && forceGraphInstance) {
      console.log('Dimensions updated:', width, height);
      forceGraphInstance.width(width).height(height);
    }
  });

  // Reactive updates for background color
  $effect(() => {
    if (browser && isInitialized && forceGraphInstance) {
      console.log('Background color updated:', backgroundColor);
      forceGraphInstance.backgroundColor(backgroundColor);
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
      <p>Initializing 3D force graph visualization</p>
    </div>
  {:else}
    <div class="graph-info variant-filled-surface p-2 rounded-lg absolute top-2 left-2 z-10">
      <p class="text-sm">
        Nodes: {graphData?.nodes.length || 0} | Links: {graphData?.links.length || 0}
        {#if sampleData && publications.length > maxNodes}
          <span class="text-warning-500"> (Sampled from {publications.length})</span>
        {/if}
      </p>
    </div>
    
    <!-- Single reactive tooltip -->
    {#if tooltipContent.show}
      <div 
        class="node-tooltip variant-filled-primary p-3 rounded-lg absolute z-20 pointer-events-none"
        style="left: 10px; bottom: 10px; max-width: 300px;"
      >
        <h4 class="font-bold text-lg mb-1">{tooltipContent.name}</h4>
        <div class="space-y-1 text-sm">
          {#if tooltipContent.category}
            <p><span class="opacity-75">Category:</span> {tooltipContent.category}</p>
          {/if}
          {#if tooltipContent.subscriberText}
            <p><span class="opacity-75">Subscribers:</span> {tooltipContent.subscriberText}</p>
          {/if}
          {#if tooltipContent.isBestseller}
            <div class="badge variant-filled-warning mt-2">⭐ Bestseller</div>
          {/if}
        </div>
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-primary-400);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>