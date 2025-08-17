import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    // Load both the graph data and category statistics
    const [graphResponse, categoriesResponse] = await Promise.all([
        fetch('/jsons/category_graph_data_optimized.json'),
        fetch('/jsons/categories.json')
    ]);
    
    const graphData = await graphResponse.json();
    const categoryStats = await categoriesResponse.json();
    
    return {
        graphData,
        categoryStats
    };
};