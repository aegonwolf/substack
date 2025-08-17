// Tests for 3D Force Graph data transformation utilities

import { describe, it, expect } from 'vitest';
import {
  transformPublicationToGraphNode,
  transformPublicationsToGraphNodes,
  transformRecommendationToGraphLink,
  transformRecommendationsToGraphLinks,
  transformToGraphData,
  getNodeColorByCategory,
  transformPublicationToGraphNodeWithCategoryColor
} from './utils.js';
import type { Publication, Recommendation } from './types.js';

describe('Publication to GraphNode transformation', () => {
  const samplePublication: Publication = {
    id: 'pub-1',
    name: 'Tech Newsletter',
    category: 'technology',
    subscriber_count: 10000,
    is_bestseller: false
  };

  const bestsellerPublication: Publication = {
    id: 'pub-2',
    name: 'Popular Business Newsletter',
    category: 'business',
    subscriber_count: 50000,
    is_bestseller: true
  };

  it('should transform publication to graph node with correct properties', () => {
    const result = transformPublicationToGraphNode(samplePublication);
    
    expect(result.id).toBe('pub-1');
    expect(result.name).toBe('Tech Newsletter');
    expect(result.category).toBe('technology');
    expect(result.subscriber_count).toBe(10000);
    expect(result.is_bestseller).toBe(false);
    expect(result.color).toBe('#4ecdc4'); // Regular publication color
    expect(result.val).toBeGreaterThan(0);
  });

  it('should assign bestseller color for bestseller publications', () => {
    const result = transformPublicationToGraphNode(bestsellerPublication);
    
    expect(result.color).toBe('#ff6b35'); // Bestseller color
    expect(result.is_bestseller).toBe(true);
  });

  it('should calculate node size based on subscriber count', () => {
    const smallPub: Publication = { ...samplePublication, subscriber_count: 1000 };
    const largePub: Publication = { ...samplePublication, subscriber_count: 100000 };
    
    const smallNode = transformPublicationToGraphNode(smallPub);
    const largeNode = transformPublicationToGraphNode(largePub);
    
    expect(largeNode.val).toBeGreaterThan(smallNode.val);
    expect(smallNode.val).toBeGreaterThanOrEqual(1); // Minimum size
  });

  it('should transform array of publications', () => {
    const publications = [samplePublication, bestsellerPublication];
    const result = transformPublicationsToGraphNodes(publications);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('pub-1');
    expect(result[1].id).toBe('pub-2');
  });
});

describe('Recommendation to GraphLink transformation', () => {
  const sampleRecommendation: Recommendation = {
    recommender_id: 'pub-1',
    recommended_id: 'pub-2'
  };

  it('should transform recommendation to graph link', () => {
    const result = transformRecommendationToGraphLink(sampleRecommendation);
    
    expect(result.source).toBe('pub-1');
    expect(result.target).toBe('pub-2');
    expect(result.color).toBe('#999999');
  });

  it('should transform array of recommendations', () => {
    const recommendations = [
      sampleRecommendation,
      { recommender_id: 'pub-2', recommended_id: 'pub-3' }
    ];
    const result = transformRecommendationsToGraphLinks(recommendations);
    
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe('pub-1');
    expect(result[1].source).toBe('pub-2');
  });
});

describe('Complete graph data transformation', () => {
  const publications: Publication[] = [
    {
      id: 'pub-1',
      name: 'Tech Newsletter',
      category: 'technology',
      subscriber_count: 10000,
      is_bestseller: false
    },
    {
      id: 'pub-2',
      name: 'Business Newsletter',
      category: 'business',
      subscriber_count: 25000,
      is_bestseller: true
    }
  ];

  const recommendations: Recommendation[] = [
    { recommender_id: 'pub-1', recommended_id: 'pub-2' }
  ];

  it('should transform complete data to graph format', () => {
    const result = transformToGraphData(publications, recommendations);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.links).toHaveLength(1);
    expect(result.nodes[0].id).toBe('pub-1');
    expect(result.links[0].source).toBe('pub-1');
    expect(result.links[0].target).toBe('pub-2');
  });
});

describe('Category-based coloring', () => {
  it('should return correct colors for known categories', () => {
    expect(getNodeColorByCategory('technology')).toBe('#3498db');
    expect(getNodeColorByCategory('business')).toBe('#2ecc71');
    expect(getNodeColorByCategory('politics')).toBe('#e74c3c');
  });

  it('should return default color for unknown categories', () => {
    expect(getNodeColorByCategory('unknown')).toBe('#95a5a6');
  });

  it('should handle case insensitive categories', () => {
    expect(getNodeColorByCategory('TECHNOLOGY')).toBe('#3498db');
    expect(getNodeColorByCategory('Technology')).toBe('#3498db');
  });
});

describe('Enhanced node transformation with category colors', () => {
  it('should use category color for non-bestseller publications', () => {
    const publication: Publication = {
      id: 'pub-1',
      name: 'Tech Newsletter',
      category: 'technology',
      subscriber_count: 10000,
      is_bestseller: false
    };

    const result = transformPublicationToGraphNodeWithCategoryColor(publication);
    expect(result.color).toBe('#3498db'); // Technology color
  });

  it('should keep bestseller color for bestseller publications', () => {
    const publication: Publication = {
      id: 'pub-1',
      name: 'Popular Newsletter',
      category: 'technology',
      subscriber_count: 50000,
      is_bestseller: true
    };

    const result = transformPublicationToGraphNodeWithCategoryColor(publication);
    expect(result.color).toBe('#ff6b35'); // Bestseller color
  });
});