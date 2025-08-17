import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    // Load the pre-optimized category graph data
    const response = await fetch('/jsons/category_graph_data_optimized.json');
    const graphData = await response.json();
    
    return {
        graphData
    };
};