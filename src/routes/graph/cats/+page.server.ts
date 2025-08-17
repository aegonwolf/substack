import type { PageServerLoad } from './$types';
import graphData from '$lib/files/category_graph_data_optimized.json';
import categoryStats from '$lib/files/categories.json';

export const load: PageServerLoad = async () => {
    // Both files are bundled at build time
    return {
        graphData,
        categoryStats
    };
};