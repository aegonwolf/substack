import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    // Load the pre-optimized graph data
    const response = await fetch('/jsons/graph_data_optimized.json');
    const graphData = await response.json();
    
    return {
        graphData
    };
};