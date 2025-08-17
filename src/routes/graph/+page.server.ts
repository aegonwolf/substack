import type { PageServerLoad } from './$types';
import graphData from '$lib/files/graph_data_optimized.json';

export const load: PageServerLoad = async () => {
    // Data is bundled at build time, no runtime fetch needed
    return {
        graphData
    };
};