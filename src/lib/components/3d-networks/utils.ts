// Data transformation utilities for 3D Force Graph

import type { Publication, GraphNode, GraphData, Recommendation, GraphLink } from './types.js';

/**
 * Transform Publication objects to GraphNode format for 3d-force-graph library
 * Calculates node size based on subscriber count and assigns colors based on publication type
 */
export function transformPublicationToGraphNode(publication: Publication): GraphNode {
  // Calculate node size based on subscriber count
  // Using square root scaling to prevent extreme size differences
  // Minimum size of 1, scaling factor based on subscriber count
  const nodeSize = Math.max(1, Math.sqrt(publication.subscriber_count / 1000));
  
  // Color assignment logic for different publication types
  // Bestsellers get a distinct color (orange/red), regular publications get teal
  const nodeColor = publication.is_bestseller ? '#ff6b35' : '#4ecdc4';
  
  return {
    id: publication.id,
    name: publication.name,
    category: publication.category,
    subscriber_count: publication.subscriber_count,
    is_bestseller: publication.is_bestseller,
    color: nodeColor,
    val: nodeSize
  };
}

/**
 * Transform array of Publications to array of GraphNodes
 */
export function transformPublicationsToGraphNodes(publications: Publication[]): GraphNode[] {
  return publications.map(transformPublicationToGraphNode);
}

/**
 * Transform Recommendation objects to GraphLink format for 3d-force-graph library
 * Creates directional links from recommender to recommended publications
 */
export function transformRecommendationToGraphLink(recommendation: Recommendation): GraphLink {
  return {
    source: recommendation.recommender_id,
    target: recommendation.recommended_id,
    color: '#999999' // Default link color
  };
}

/**
 * Transform array of Recommendations to array of GraphLinks
 */
export function transformRecommendationsToGraphLinks(recommendations: Recommendation[]): GraphLink[] {
  return recommendations.map(transformRecommendationToGraphLink);
}

/**
 * Transform publications and recommendations to complete GraphData format
 * This is the main transformation function that combines both nodes and links
 */
export function transformToGraphData(
  publications: Publication[], 
  recommendations: Recommendation[]
): GraphData {
  const nodes = transformPublicationsToGraphNodes(publications);
  const links = transformRecommendationsToGraphLinks(recommendations);
  
  return { nodes, links };
}

/**
 * Create color scale for dynamic color assignment based on a property
 * This can be used for more advanced color schemes based on categories or other properties
 */
export function getNodeColorByCategory(category: string): string {
  // Simple color mapping for different categories
  const colorMap: Record<string, string> = {
    'technology': '#3498db',
    'business': '#2ecc71',
    'politics': '#e74c3c',
    'culture': '#9b59b6',
    'science': '#f39c12',
    'health': '#1abc9c',
    'finance': '#34495e',
    'education': '#e67e22',
    'entertainment': '#e91e63',
    'sports': '#795548'
  };
  
  // Return category-specific color or default color
  return colorMap[category.toLowerCase()] || '#95a5a6';
}

/**
 * Enhanced node transformation with category-based coloring
 */
export function transformPublicationToGraphNodeWithCategoryColor(publication: Publication): GraphNode {
  const baseNode = transformPublicationToGraphNode(publication);
  
  // Override color with category-based color if not a bestseller
  if (!publication.is_bestseller) {
    baseNode.color = getNodeColorByCategory(publication.category);
  }
  
  return baseNode;
}