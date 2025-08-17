// Data model interfaces for network graph visualization

export interface Publication {
  id: string;
  name: string;
  category: string;
  subscriber_count: number;
  is_bestseller: boolean;
}

export interface Recommendation {
  recommender_id: string;
  recommended_id: string;
}

export interface ProcessedNode {
  id: string;
  name: string;
  category: string;
  subscriber_count: number;
  x: number;
  y: number;
  nodeType: 'bestseller' | 'recommendation' | 'dual';
  side: 'left' | 'right';
  group: 'bestseller' | 'recommendation-only' | 'dual-role';
  // D3 simulation properties (optional, added during simulation)
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  vx?: number; // Velocity x
  vy?: number; // Velocity y
}

export interface Edge {
  id: string;
  source: ProcessedNode;
  target: ProcessedNode;
  path: string; // SVG path data
  strength: number;
}

export interface LayoutConfig {
  nodeRadius: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  edgeCurvature: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface NetworkGraphProps {
  publications: Publication[];
  recommendations: Recommendation[];
  width?: number;
  height?: number;
}