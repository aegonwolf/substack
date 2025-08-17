// TypeScript interfaces for 3D Force Graph component

// Input data models (from application)
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

// 3D Force Graph data models (for 3d-force-graph library)
export interface GraphNode {
  id: string;
  name: string;
  category: string;
  subscriber_count: number;
  is_bestseller: boolean;
  color?: string;
  val?: number; // Node size based on subscriber count
}

export interface GraphLink {
  source: string;
  target: string;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Component props interface
export interface ForceGraph3DProps {
  publications: Publication[];
  recommendations: Recommendation[];
  width?: number;
  height?: number;
  backgroundColor?: string;
  nodeAutoColorBy?: string;
  linkAutoColorBy?: string;
}

// Event handler types
export type NodeClickHandler = (node: GraphNode, event: MouseEvent) => void;
export type NodeHoverHandler = (node: GraphNode | null, prevNode: GraphNode | null) => void;
export type LinkClickHandler = (link: GraphLink, event: MouseEvent) => void;