// +page.ts
import type { PageLoad } from './$types';

// Disable SSR for this page - no CPU-heavy serialization!
export const ssr = false;
export const prerender = false;

export const load: PageLoad = async () => {
	// The JSON lives under /static/graph/graph_data_optimized.json
	// (served at /graph/graph_data_optimized.json)
	return {
		graphDataUrl: '/jsons/graph_data_optimized.json'
	};
};
