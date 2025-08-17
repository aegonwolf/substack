import type { PageServerLoad } from './$types';
import graphData from '$lib/files/graph_data_optimized.json';

export const load: PageServerLoad = async () => {
    return {
        graphData
    };
};