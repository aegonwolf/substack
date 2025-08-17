import type { PageServerLoad } from './$types';
import graphData from '$lib/../../../static/jsons/category_graph_data_optimized.json';
import categoryStats from '$lib/../../../static/jsons/categories.json';

export const load: PageServerLoad = async () => {
    // Both files are bundled at build time
    return {
        graphData,
        categoryStats
    };
};