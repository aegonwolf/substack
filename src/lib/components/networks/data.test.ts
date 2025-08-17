import { describe, it, expect, beforeEach } from 'vitest';
import { 
  processPublications, 
  identifyDualRolePublications, 
  calculateNodePositions,
  createEdges,
  bundleEdges,
  calculateEdgeStatistics
} from './data.js';
import type { Publication, Recommendation, ProcessedNode } from './types.js';

describe('Node Processing Utilities', () => {
  const mockPublications: Publication[] = [
    {
      id: 'pub1',
      name: 'Bestseller One',
      category: 'Newsletter',
      subscriber_count: 50000,
      is_bestseller: true
    },
    {
      id: 'pub2',
      name: 'Bestseller Two',
      category: 'Newsletter',
      subscriber_count: 30000,
      is_bestseller: true
    },
    {
      id: 'pub3',
      name: 'Recommendation Only',
      category: 'Newsletter',
      subscriber_count: 5000,
      is_bestseller: false
    },
    {
      id: 'pub4',
      name: 'Dual Role',
      category: 'Newsletter',
      subscriber_count: 25000,
      is_bestseller: true
    }
  ];

  const mockRecommendations: Recommendation[] = [
    { recommender_id: 'pub1', recommended_id: 'pub3' },
    { recommender_id: 'pub1', recommended_id: 'pub4' }, // pub4 is dual-role
    { recommender_id: 'pub2', recommended_id: 'pub3' }
  ];

  describe('identifyDualRolePublications', () => {
    it('should identify publications that are both bestsellers and recommended', () => {
      const dualRoles = identifyDualRolePublications(mockPublications, mockRecommendations);
      
      expect(dualRoles.has('pub4')).toBe(true); // Is bestseller and recommended
      expect(dualRoles.has('pub1')).toBe(false); // Is bestseller but not recommended
      expect(dualRoles.has('pub3')).toBe(false); // Is recommended but not bestseller
    });
  });

  describe('processPublications', () => {
    it('should create ProcessedNode objects with correct properties', () => {
      const processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
      
      // Should have nodes for all publications that are either bestsellers or recommended
      expect(processedNodes.length).toBeGreaterThan(0);
      
      // Check that all nodes have required properties
      processedNodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('x');
        expect(node).toHaveProperty('y');
        expect(node).toHaveProperty('nodeType');
        expect(node).toHaveProperty('side');
        expect(node).toHaveProperty('group');
      });
    });

    it('should position bestsellers on the left side', () => {
      const processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
      
      const bestsellerNodes = processedNodes.filter(node => node.side === 'left');
      bestsellerNodes.forEach(node => {
        expect(node.x).toBe(200); // 25% of 800
        expect(node.side).toBe('left');
      });
    });

    it('should position recommendations on the right side', () => {
      const processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
      
      const recommendationNodes = processedNodes.filter(node => node.side === 'right');
      recommendationNodes.forEach(node => {
        expect(node.x).toBe(600); // 75% of 800
        expect(node.side).toBe('right');
      });
    });

    it('should correctly identify dual-role nodes', () => {
      const processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
      
      const dualNodes = processedNodes.filter(node => node.nodeType === 'dual');
      expect(dualNodes.length).toBeGreaterThan(0);
      
      // pub4 should appear as dual-role on both sides
      const leftDualNode = processedNodes.find(node => node.id === 'pub4' && node.side === 'left');
      const rightDualNode = processedNodes.find(node => node.id === 'pub4' && node.side === 'right');
      
      expect(leftDualNode?.nodeType).toBe('dual');
      expect(rightDualNode?.nodeType).toBe('dual');
    });

    it('should sort bestsellers by subscriber count', () => {
      const processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
      
      const leftNodes = processedNodes.filter(node => node.side === 'left');
      leftNodes.sort((a, b) => a.y - b.y); // Sort by y position (top to bottom)
      
      // Should be ordered by subscriber count descending
      for (let i = 0; i < leftNodes.length - 1; i++) {
        expect(leftNodes[i].subscriber_count).toBeGreaterThanOrEqual(leftNodes[i + 1].subscriber_count);
      }
    });
  });

  describe('calculateNodePositions', () => {
    it('should calculate correct x position for left side', () => {
      const result = calculateNodePositions(3, 800, 600, 'left');
      expect(result.x).toBe(200); // 25% of 800
    });

    it('should calculate correct x position for right side', () => {
      const result = calculateNodePositions(3, 800, 600, 'right');
      expect(result.x).toBe(600); // 75% of 800
    });

    it('should distribute y positions evenly', () => {
      const result = calculateNodePositions(3, 800, 600, 'left');
      
      expect(result.yPositions).toHaveLength(3);
      expect(result.yPositions[0]).toBe(60); // 10% margin
      expect(result.yPositions[2]).toBe(540); // 90% - 10% margin
    });

    it('should handle single node positioning', () => {
      const result = calculateNodePositions(1, 800, 600, 'left');
      
      expect(result.yPositions).toHaveLength(1);
      expect(result.yPositions[0]).toBe(300); // Center of height
    });
  });

  describe('Edge Calculation Functions', () => {
    let processedNodes: ProcessedNode[];

    beforeEach(() => {
      processedNodes = processPublications(mockPublications, mockRecommendations, 800, 600);
    });

    describe('createEdges', () => {
      it('should create edge objects from recommendation relationships', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        
        expect(edges).toHaveLength(mockRecommendations.length);
        
        edges.forEach(edge => {
          expect(edge).toHaveProperty('id');
          expect(edge).toHaveProperty('source');
          expect(edge).toHaveProperty('target');
          expect(edge).toHaveProperty('path');
          expect(edge).toHaveProperty('strength');
          expect(typeof edge.path).toBe('string');
          expect(edge.strength).toBeGreaterThan(0);
          expect(edge.strength).toBeLessThanOrEqual(1);
        });
      });

      it('should generate valid SVG path data', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        
        edges.forEach(edge => {
          expect(edge.path).toMatch(/^M [\d.-]+ [\d.-]+ C [\d.-]+ [\d.-]+, [\d.-]+ [\d.-]+, [\d.-]+ [\d.-]+$/);
        });
      });

      it('should calculate connection strength based on node properties', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        
        // Find edge from high subscriber count node
        const highSubscriberEdge = edges.find(edge => edge.source.subscriber_count > 40000);
        const lowSubscriberEdge = edges.find(edge => edge.source.subscriber_count < 10000);
        
        if (highSubscriberEdge && lowSubscriberEdge) {
          expect(highSubscriberEdge.strength).toBeGreaterThan(lowSubscriberEdge.strength);
        }
      });

      it('should skip edges for missing nodes', () => {
        const invalidRecommendations: Recommendation[] = [
          { recommender_id: 'nonexistent1', recommended_id: 'nonexistent2' },
          ...mockRecommendations
        ];
        
        const edges = createEdges(invalidRecommendations, processedNodes);
        
        // Should only create edges for valid recommendations
        expect(edges).toHaveLength(mockRecommendations.length);
      });
    });

    describe('bundleEdges', () => {
      it('should return same number of edges after bundling', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        const bundledEdges = bundleEdges(edges);
        
        expect(bundledEdges).toHaveLength(edges.length);
      });

      it('should modify paths for nodes with multiple connections', () => {
        // Create additional recommendations to test bundling
        const multipleRecommendations: Recommendation[] = [
          ...mockRecommendations,
          { recommender_id: 'pub1', recommended_id: 'pub2' }, // pub1 now has 3 outgoing edges
        ];
        
        const edges = createEdges(multipleRecommendations, processedNodes);
        const bundledEdges = bundleEdges(edges);
        
        // Find edges from pub1 (should have multiple outgoing connections)
        const pub1Edges = edges.filter(edge => edge.source.id === 'pub1');
        const bundledPub1Edges = bundledEdges.filter(edge => edge.source.id === 'pub1');
        
        if (pub1Edges.length > 1) {
          // At least some paths should be different after bundling
          const pathsChanged = bundledPub1Edges.some((bundledEdge, index) => 
            bundledEdge.path !== pub1Edges[index].path
          );
          expect(pathsChanged).toBe(true);
        }
      });

      it('should preserve edge metadata during bundling', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        const bundledEdges = bundleEdges(edges);
        
        bundledEdges.forEach((bundledEdge, index) => {
          const originalEdge = edges[index];
          expect(bundledEdge.id).toBe(originalEdge.id);
          expect(bundledEdge.source).toBe(originalEdge.source);
          expect(bundledEdge.target).toBe(originalEdge.target);
          expect(bundledEdge.strength).toBe(originalEdge.strength);
        });
      });
    });

    describe('calculateEdgeStatistics', () => {
      it('should calculate correct edge statistics', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        const stats = calculateEdgeStatistics(edges);
        
        expect(stats.totalEdges).toBe(edges.length);
        expect(stats.averageStrength).toBeGreaterThan(0);
        expect(stats.averageStrength).toBeLessThanOrEqual(1);
        expect(stats.maxConnectionsPerNode).toBeGreaterThan(0);
        expect(stats.nodesWithMultipleConnections).toBeGreaterThanOrEqual(0);
      });

      it('should identify nodes with multiple connections', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        const stats = calculateEdgeStatistics(edges);
        
        // pub1 has 2 outgoing connections, pub3 has 2 incoming connections
        expect(stats.nodesWithMultipleConnections).toBeGreaterThan(0);
      });

      it('should calculate average strength correctly', () => {
        const edges = createEdges(mockRecommendations, processedNodes);
        const stats = calculateEdgeStatistics(edges);
        
        const manualAverage = edges.reduce((sum, edge) => sum + edge.strength, 0) / edges.length;
        expect(stats.averageStrength).toBeCloseTo(manualAverage, 5);
      });
    });
  });
});