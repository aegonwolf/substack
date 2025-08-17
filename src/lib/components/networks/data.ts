import type { Publication, Recommendation, ProcessedNode, Edge } from './types.js';

// Temporary interface extensions to allow null subscriber_count until types.ts is updated
interface PublicationWithNullableSubscriberCount extends Omit<Publication, 'subscriber_count'> {
  subscriber_count: number | null;
}

interface ProcessedNodeWithNullableSubscriberCount extends Omit<ProcessedNode, 'subscriber_count'> {
  subscriber_count: number | null;
}

interface EdgeWithNullableSubscriberCount extends Omit<Edge, 'source' | 'target'> {
  source: ProcessedNodeWithNullableSubscriberCount;
  target: ProcessedNodeWithNullableSubscriberCount;
}

// Load and process recommendation data from JSON
export async function loadRecommendationData(): Promise<{
  publications: PublicationWithNullableSubscriberCount[];
  recommendations: Recommendation[];
}> {
  try {
    const [recommendationsResponse, subscriberCountsResponse] = await Promise.all([
      fetch('/jsons/recommendations.json'),
      fetch('/jsons/subscriber_counts.json')
    ]);
    
    const rawData = await recommendationsResponse.json();
    const subscriberCountsData = await subscriberCountsResponse.json();
    
    // Extract the recommendation object from the array
    const recommendationData = rawData[0];
    
    // Create a mapping from publication URL to subscriber count
    const subscriberCountMap = new Map<string, number>();
    subscriberCountsData.forEach((item: any) => {
      if (item.publication_url && item.subscriber_count) {
        subscriberCountMap.set(item.publication_url, item.subscriber_count);
      }
    });
    
    console.log('Loaded subscriber count data for', subscriberCountMap.size, 'publications');
    
    // Create sets to track all unique publications
    const allPublications = new Set<string>();
    const recommendations: Recommendation[] = [];
    
    // Process recommendations and collect all publication IDs
    for (const [recommenderUrl, recommendedUrls] of Object.entries(recommendationData)) {
      allPublications.add(recommenderUrl);
      
      for (const recommendedUrl of recommendedUrls as string[]) {
        allPublications.add(recommendedUrl);
        
        recommendations.push({
          recommender_id: recommenderUrl,
          recommended_id: recommendedUrl
        });
      }
    }
    
    // Create publication objects
    const publications: PublicationWithNullableSubscriberCount[] = Array.from(allPublications).map((url, index) => {
      // Extract publication name from URL
      const name = extractPublicationName(url);
      
      // Determine if this is a bestseller (appears as a key in the recommendation data)
      const is_bestseller = Object.keys(recommendationData).includes(url);
      
      const subscriber_count = subscriberCountMap.get(url) || null;
      
      return {
        id: url,
        name: name,
        category: categorizePublication(url),
        subscriber_count: subscriber_count,
        is_bestseller: is_bestseller
      };
    });
    
    const publicationsWithSubscriberData = publications.filter(pub => pub.subscriber_count !== null);
    console.log('Publications with subscriber data:', publicationsWithSubscriberData.length, 'out of', publications.length);
    
    return {
      publications,
      recommendations
    };
  } catch (error) {
    console.error('Failed to load recommendation data:', error);
    throw error;
  }
}

// Extract a readable name from the publication URL
function extractPublicationName(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Remove www. prefix if present
    hostname = hostname.replace(/^www\./, '');
    
    // For substack URLs, extract the subdomain
    if (hostname.includes('.substack.com')) {
      const subdomain = hostname.split('.')[0];
      return subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
    }
    
    // For other domains, use the main domain name
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const mainDomain = parts[parts.length - 2];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
    
    return hostname;
  } catch {
    // Fallback if URL parsing fails
    return url.replace(/https?:\/\//, '').split('/')[0];
  }
}

// Categorize publications based on URL patterns
function categorizePublication(url: string): string {
  if (url.includes('substack.com')) {
    return 'Newsletter';
  } else if (url.includes('.com') || url.includes('.org') || url.includes('.net')) {
    return 'Website';
  } else {
    return 'Publication';
  }
}



// Node processing utilities for bipartite graph visualization

/**
 * Transform raw publication data into ProcessedNode objects for bipartite graph layout
 * @param publications Array of publication data
 * @param recommendations Array of recommendation relationships
 * @param width Graph width for positioning calculations
 * @param height Graph height for positioning calculations
 * @returns Array of ProcessedNode objects with calculated positions and metadata
 */
export function processPublications(
  publications: PublicationWithNullableSubscriberCount[],
  recommendations: Recommendation[],
  width: number = 800,
  height: number = 600
): ProcessedNodeWithNullableSubscriberCount[] {
  // Identify dual-role publications (appear in both bestseller and recommendation sets)
  const dualRolePublications = identifyDualRolePublications(publications, recommendations);
  
  // Separate publications into left (bestsellers) and right (recommendations) sets
  const bestsellers = publications.filter(pub => pub.is_bestseller);
  const recommendedIds = new Set(recommendations.map(rec => rec.recommended_id));
  const recommendedPublications = publications.filter(pub => recommendedIds.has(pub.id));
  
  const processedNodes: ProcessedNodeWithNullableSubscriberCount[] = [];
  
  // Process bestseller nodes (left side)
  const leftNodes = processLeftSideNodes(bestsellers, dualRolePublications, width, height);
  processedNodes.push(...leftNodes);
  
  // Process recommendation nodes (right side), excluding those already on the left
  const rightOnlyPublications = recommendedPublications.filter(
    pub => !bestsellers.some(bs => bs.id === pub.id)
  );
  const rightNodes = processRightSideNodes(rightOnlyPublications, dualRolePublications, width, height);
  processedNodes.push(...rightNodes);
  
  return processedNodes;
}

/**
 * Identify publications that appear in both bestseller and recommendation sets
 * @param publications Array of all publications
 * @param recommendations Array of recommendation relationships
 * @returns Set of publication IDs that have dual roles
 */
export function identifyDualRolePublications(
  publications: PublicationWithNullableSubscriberCount[],
  recommendations: Recommendation[]
): Set<string> {
  const bestsellerIds = new Set(publications.filter(pub => pub.is_bestseller).map(pub => pub.id));
  const recommendedIds = new Set(recommendations.map(rec => rec.recommended_id));
  
  // Find intersection - publications that are both bestsellers and recommended
  const dualRoleIds = new Set<string>();
  bestsellerIds.forEach(id => {
    if (recommendedIds.has(id)) {
      dualRoleIds.add(id);
    }
  });
  
  return dualRoleIds;
}

/**
 * Process bestseller publications for left side positioning
 * @param bestsellers Array of bestseller publications
 * @param dualRoleIds Set of dual-role publication IDs
 * @param width Graph width
 * @param height Graph height
 * @returns Array of ProcessedNode objects for left side
 */
function processLeftSideNodes(
  bestsellers: PublicationWithNullableSubscriberCount[],
  dualRoleIds: Set<string>,
  width: number,
  height: number
): ProcessedNodeWithNullableSubscriberCount[] {
  // Sort bestsellers by subscriber count (descending) when available, otherwise by name
  const sortedBestsellers = [...bestsellers].sort((a, b) => {
    // If both have subscriber counts, sort by count (descending)
    if (a.subscriber_count !== null && b.subscriber_count !== null) {
      return b.subscriber_count - a.subscriber_count;
    }
    // If only one has subscriber count, prioritize it
    if (a.subscriber_count !== null && b.subscriber_count === null) return -1;
    if (a.subscriber_count === null && b.subscriber_count !== null) return 1;
    // If neither has subscriber count, sort by name
    return a.name.localeCompare(b.name);
  });
  
  const leftX = width * 0.25; // Position at 25% of width
  const topMargin = 80; // Fixed top margin
  const nodeSpacing = 25; // Fixed spacing between nodes
  
  return sortedBestsellers.map((pub, index) => {
    // Stack nodes with fixed spacing
    const y = topMargin + (index * nodeSpacing);
    
    return {
      id: pub.id,
      name: pub.name,
      category: pub.category,
      subscriber_count: pub.subscriber_count,
      x: leftX,
      y: y,
      nodeType: dualRoleIds.has(pub.id) ? 'dual' : 'bestseller',
      side: 'left',
      group: dualRoleIds.has(pub.id) ? 'dual-role' : 'bestseller'
    };
  });
}

/**
 * Process recommended publications for right side positioning
 * @param recommendedPublications Array of recommended publications
 * @param dualRoleIds Set of dual-role publication IDs
 * @param width Graph width
 * @param height Graph height
 * @returns Array of ProcessedNode objects for right side
 */
function processRightSideNodes(
  recommendedPublications: PublicationWithNullableSubscriberCount[],
  dualRoleIds: Set<string>,
  width: number,
  height: number
): ProcessedNodeWithNullableSubscriberCount[] {
  // Separate dual-role and recommendation-only publications
  const dualRoleRecommendations = recommendedPublications.filter(pub => dualRoleIds.has(pub.id));
  const recommendationOnlyPubs = recommendedPublications.filter(pub => !dualRoleIds.has(pub.id));
  
  // Sort each group consistently
  // Dual-role: by subscriber count when available, otherwise by name
  const sortedDualRole = [...dualRoleRecommendations].sort((a, b) => {
    // If both have subscriber counts, sort by count (descending)
    if (a.subscriber_count !== null && b.subscriber_count !== null) {
      return b.subscriber_count - a.subscriber_count;
    }
    // If only one has subscriber count, prioritize it
    if (a.subscriber_count !== null && b.subscriber_count === null) return -1;
    if (a.subscriber_count === null && b.subscriber_count !== null) return 1;
    // If neither has subscriber count, sort by name
    return a.name.localeCompare(b.name);
  });
  
  // Recommendation-only: alphabetically by name for consistent ordering
  const sortedRecommendationOnly = [...recommendationOnlyPubs].sort((a, b) => a.name.localeCompare(b.name));
  
  const rightX = width * 0.75; // Position at 75% of width
  const topMargin = 80; // Same as left side
  const nodeSpacing = 25; // Same spacing as left side
  
  const processedNodes: ProcessedNodeWithNullableSubscriberCount[] = [];
  let currentY = topMargin;
  
  // Process dual-role nodes first
  sortedDualRole.forEach((pub) => {
    processedNodes.push({
      id: pub.id,
      name: pub.name,
      category: pub.category,
      subscriber_count: pub.subscriber_count,
      x: rightX,
      y: currentY,
      nodeType: 'dual',
      side: 'right',
      group: 'dual-role'
    });
    currentY += nodeSpacing;
  });
  
  // Add small gap between dual-role and recommendation-only nodes
  if (sortedDualRole.length > 0 && sortedRecommendationOnly.length > 0) {
    currentY += 10; // Small visual separator
  }
  
  // Process recommendation-only nodes
  sortedRecommendationOnly.forEach((pub) => {
    processedNodes.push({
      id: pub.id,
      name: pub.name,
      category: pub.category,
      subscriber_count: pub.subscriber_count,
      x: rightX,
      y: currentY,
      nodeType: 'recommendation',
      side: 'right',
      group: 'recommendation-only'
    });
    currentY += nodeSpacing;
  });
  
  return processedNodes;
}

/**
 * Calculate optimal node positions based on graph dimensions and node count
 * @param nodeCount Number of nodes to position
 * @param width Graph width
 * @param height Graph height
 * @param side Which side ('left' or 'right') to position nodes
 * @returns Object with x coordinate and array of y coordinates
 */
export function calculateNodePositions(
  nodeCount: number,
  width: number,
  height: number,
  side: 'left' | 'right'
): { x: number; yPositions: number[] } {
  const x = side === 'left' ? width * 0.25 : width * 0.75;
  const topMargin = height * 0.1;
  const bottomMargin = height * 0.1;
  const availableHeight = height - topMargin - bottomMargin;
  
  const yPositions: number[] = [];
  
  if (nodeCount === 1) {
    yPositions.push(height / 2);
  } else {
    for (let i = 0; i < nodeCount; i++) {
      const y = topMargin + (i / (nodeCount - 1)) * availableHeight;
      yPositions.push(y);
    }
  }
  
  return { x, yPositions };
}

// Edge calculation functions for bipartite graph visualization

/**
 * Create edge objects from recommendation relationships
 * @param recommendations Array of recommendation relationships
 * @param processedNodes Array of processed nodes with positions
 * @returns Array of Edge objects with calculated paths and metadata
 */
export function createEdges(
  recommendations: Recommendation[],
  processedNodes: ProcessedNodeWithNullableSubscriberCount[]
): EdgeWithNullableSubscriberCount[] {
  // Create a map for quick node lookup by ID
  const nodeMap = new Map<string, ProcessedNodeWithNullableSubscriberCount>();
  processedNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  const edges: EdgeWithNullableSubscriberCount[] = [];
  
  // Process each recommendation relationship
  recommendations.forEach((rec, index) => {
    const sourceNode = nodeMap.get(rec.recommender_id);
    const targetNode = nodeMap.get(rec.recommended_id);
    
    // Skip if either node is not found
    if (!sourceNode || !targetNode) {
      return;
    }
    
    // Calculate connection strength based on node types and subscriber counts
    const strength = calculateConnectionStrength(sourceNode, targetNode);
    
    // Generate SVG path data for curved connection
    const path = generateCurvedPath(sourceNode, targetNode);
    
    // Create edge object
    const edge: EdgeWithNullableSubscriberCount = {
      id: `edge-${index}-${sourceNode.id}-${targetNode.id}`,
      source: sourceNode,
      target: targetNode,
      path: path,
      strength: strength
    };
    
    edges.push(edge);
  });
  
  return edges;
}

/**
 * Calculate connection strength between two nodes
 * @param sourceNode Source node (recommender)
 * @param targetNode Target node (recommended)
 * @returns Strength value between 0 and 1
 */
function calculateConnectionStrength(sourceNode: ProcessedNodeWithNullableSubscriberCount, targetNode: ProcessedNodeWithNullableSubscriberCount): number {
  // Base strength starts at 0.5
  let strength = 0.5;
  
  // Use real subscriber count data when available, otherwise use bestseller status
  if (sourceNode.subscriber_count !== null) {
    // Use actual subscriber count for connection strength
    if (sourceNode.subscriber_count > 100000) {
      strength += 0.3;
    } else if (sourceNode.subscriber_count > 50000) {
      strength += 0.2;
    } else if (sourceNode.subscriber_count > 10000) {
      strength += 0.1;
    }
  } else {
    // Fallback to bestseller status when subscriber count is not available
    if (sourceNode.nodeType === 'bestseller' || sourceNode.nodeType === 'dual') {
      strength += 0.2;
    }
  }
  
  // Increase strength for dual-role nodes (they appear in both sets)
  if (sourceNode.nodeType === 'dual') {
    strength += 0.1;
  }
  if (targetNode.nodeType === 'dual') {
    strength += 0.1;
  }
  
  // Ensure strength stays within bounds
  return Math.min(1.0, Math.max(0.1, strength));
}

/**
 * Generate SVG path data for curved connections between nodes
 * @param sourceNode Source node position
 * @param targetNode Target node position
 * @returns SVG path string for curved connection
 */
function generateCurvedPath(sourceNode: ProcessedNodeWithNullableSubscriberCount, targetNode: ProcessedNodeWithNullableSubscriberCount): string {
  const x1 = sourceNode.x;
  const y1 = sourceNode.y;
  const x2 = targetNode.x;
  const y2 = targetNode.y;
  
  // Calculate control points for smooth curve
  const distance = Math.abs(x2 - x1);
  const curvature = distance * 0.15; // Subtle curve for cleaner look
  
  // Create control points for cubic bezier curve
  // Use horizontal offset only for cleaner bipartite edges
  const cp1x = x1 + curvature;
  const cp1y = y1;
  const cp2x = x2 - curvature;
  const cp2y = y2;
  
  // Generate SVG path using cubic bezier curve for smooth connections
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Implement edge bundling logic for publications with multiple connections
 * @param edges Array of all edges
 * @returns Array of edges with bundling adjustments applied
 */
export function bundleEdges(edges: EdgeWithNullableSubscriberCount[]): EdgeWithNullableSubscriberCount[] {
  // Group edges by source node to identify nodes with multiple outgoing connections
  const edgesBySource = new Map<string, EdgeWithNullableSubscriberCount[]>();
  edges.forEach(edge => {
    const sourceId = edge.source.id;
    if (!edgesBySource.has(sourceId)) {
      edgesBySource.set(sourceId, []);
    }
    edgesBySource.get(sourceId)!.push(edge);
  });
  
  // Group edges by target node to identify nodes with multiple incoming connections
  const edgesByTarget = new Map<string, EdgeWithNullableSubscriberCount[]>();
  edges.forEach(edge => {
    const targetId = edge.target.id;
    if (!edgesByTarget.has(targetId)) {
      edgesByTarget.set(targetId, []);
    }
    edgesByTarget.get(targetId)!.push(edge);
  });
  
  const bundledEdges: EdgeWithNullableSubscriberCount[] = [];
  
  edges.forEach(edge => {
    const sourceEdges = edgesBySource.get(edge.source.id) || [];
    const targetEdges = edgesByTarget.get(edge.target.id) || [];
    
    // Apply bundling if node has multiple connections
    let bundledPath = edge.path;
    
    if (sourceEdges.length > 1) {
      // Apply source bundling - spread outgoing edges
      const sourceIndex = sourceEdges.indexOf(edge);
      bundledPath = applySourceBundling(edge, sourceIndex, sourceEdges.length);
    }
    
    if (targetEdges.length > 1) {
      // Apply target bundling - spread incoming edges
      const targetIndex = targetEdges.indexOf(edge);
      bundledPath = applyTargetBundling(bundledPath, edge, targetIndex, targetEdges.length);
    }
    
    // Create new edge with bundled path
    const bundledEdge: EdgeWithNullableSubscriberCount = {
      ...edge,
      path: bundledPath
    };
    
    bundledEdges.push(bundledEdge);
  });
  
  return bundledEdges;
}

/**
 * Apply source bundling to spread outgoing edges from a node
 * @param edge Original edge
 * @param edgeIndex Index of this edge among source edges
 * @param totalEdges Total number of edges from this source
 * @returns Modified SVG path with source bundling
 */
function applySourceBundling(edge: EdgeWithNullableSubscriberCount, edgeIndex: number, totalEdges: number): string {
  const x1 = edge.source.x;
  const y1 = edge.source.y;
  const x2 = edge.target.x;
  const y2 = edge.target.y;
  
  // Calculate vertical offset for edge spreading
  const spreadRange = 40; // Total vertical range for spreading edges
  const offsetStep = totalEdges > 1 ? spreadRange / (totalEdges - 1) : 0;
  const yOffset = (edgeIndex * offsetStep) - (spreadRange / 2);
  
  // Adjust source y position for bundling
  const adjustedY1 = y1 + yOffset;
  
  // Recalculate curve with adjusted source position
  const midX = (x1 + x2) / 2;
  const curvature = Math.abs(x2 - x1) * 0.3;
  
  const cp1x = x1 + curvature;
  const cp1y = adjustedY1;
  const cp2x = x2 - curvature;
  const cp2y = y2;
  
  return `M ${x1} ${adjustedY1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Apply target bundling to spread incoming edges to a node
 * @param currentPath Current SVG path (may already have source bundling)
 * @param edge Original edge
 * @param edgeIndex Index of this edge among target edges
 * @param totalEdges Total number of edges to this target
 * @returns Modified SVG path with target bundling
 */
function applyTargetBundling(currentPath: string, edge: EdgeWithNullableSubscriberCount, edgeIndex: number, totalEdges: number): string {
  // Parse the current path to extract coordinates
  const pathMatch = currentPath.match(/M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+)/);
  
  if (!pathMatch) {
    return currentPath; // Return original if parsing fails
  }
  
  const [, startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY] = pathMatch.map(Number);
  
  // Calculate vertical offset for target edge spreading
  const spreadRange = 40; // Total vertical range for spreading edges
  const offsetStep = totalEdges > 1 ? spreadRange / (totalEdges - 1) : 0;
  const yOffset = (edgeIndex * offsetStep) - (spreadRange / 2);
  
  // Adjust target y position for bundling
  const adjustedEndY = endY + yOffset;
  
  // Adjust second control point to match new target position
  const adjustedCp2y = cp2y + (yOffset * 0.5); // Partial adjustment for smooth curve
  
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${adjustedCp2y}, ${endX} ${adjustedEndY}`;
}

/**
 * Calculate edge statistics for visualization insights
 * @param edges Array of edges
 * @returns Object with edge statistics
 */
export function calculateEdgeStatistics(edges: EdgeWithNullableSubscriberCount[]): {
  totalEdges: number;
  averageStrength: number;
  maxConnectionsPerNode: number;
  nodesWithMultipleConnections: number;
} {
  const totalEdges = edges.length;
  const averageStrength = edges.reduce((sum, edge) => sum + edge.strength, 0) / totalEdges;
  
  // Count connections per node
  const connectionCounts = new Map<string, number>();
  edges.forEach(edge => {
    // Count outgoing connections from source
    const sourceId = edge.source.id;
    connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
    
    // Count incoming connections to target
    const targetId = edge.target.id;
    connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
  });
  
  const maxConnectionsPerNode = Math.max(...Array.from(connectionCounts.values()));
  const nodesWithMultipleConnections = Array.from(connectionCounts.values()).filter(count => count > 1).length;
  
  return {
    totalEdges,
    averageStrength,
    maxConnectionsPerNode,
    nodesWithMultipleConnections
  };
}