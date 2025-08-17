import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    // Load only the small category statistics server-side
    // Graph data will be loaded client-side
    const categoriesResponse = await fetch('/jsons/categories.json');
    const categoryStats = await categoriesResponse.json();
    
    return {
        graphMetadata: {
            dataUrl: '/jsons/category_graph_data_optimized.json'
        },
        categoryStats
    };
};