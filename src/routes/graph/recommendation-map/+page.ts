import type { PageLoad } from './$types';
import graphData from '$lib/files/graph_data_optimized.json';

// Disable SSR for this page - no CPU-heavy serialization!
export const ssr = false;
export const prerender = false;

export const load: PageLoad = async () => {
    return {
        graphData
    };
};