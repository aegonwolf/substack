import type { NodeT } from './types.js';

// Math utility functions
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Level-of-detail: fraction of links to draw at a given zoom
// (0 when far out, 100% when zoomed in)
export function linkFractionForK(k: number) {
	if (k < 0.5) return 0.0;
	if (k < 1.0) return 0.12;
	if (k < 2.0) return 0.28;
	if (k < 3.0) return 0.6;
	return 1.0;
}

// Deterministic per-link random in [0,1) so sampling is stable
export function hash01(str: string) {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	// xorshift
	h ^= h >>> 13;
	h = Math.imul(h, 0x5bd1e995);
	h ^= h >>> 15;
	return (h >>> 0) / 4294967296;
}

// Convert mouse/pointer event coordinates to graph coordinates
export function toGraphCoords(
	ev: MouseEvent | PointerEvent,
	canvasEl: HTMLCanvasElement,
	transform: { x: number; y: number; k: number },
	dpr: number
) {
	const rect = canvasEl.getBoundingClientRect();
	const sx = ev.clientX - rect.left;
	const sy = ev.clientY - rect.top;
	return {
		x: (sx * dpr - transform.x) / transform.k,
		y: (sy * dpr - transform.y) / transform.k
	};
}

// Rebuild quadtree for hit testing
export function rebuildQuadtree(
	Quadtree: any,
	nodes: NodeT[]
) {
	if (!Quadtree) return null;
	return Quadtree.quadtree(
		nodes,
		(d: NodeT) => d.x,
		(d: NodeT) => d.y
	);
}

// URL validation utility function
export function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return url.startsWith('http://') || url.startsWith('https://');
	} catch {
		return false;
	}
}

// Generate starfield background
export function generateStars(width: number, height: number, dpr: number) {
	const stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];
	const numStars = Math.floor((width * height) / 3000); // Density of stars
	for (let i = 0; i < numStars; i++) {
		stars.push({
			x: Math.random() * width * dpr,
			y: Math.random() * height * dpr,
			size: Math.random() * 1.5 + 0.5,
			brightness: Math.random() * 0.8 + 0.2
		});
	}
	return stars;
}