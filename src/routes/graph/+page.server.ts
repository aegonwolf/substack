import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Return minimal metadata - actual graph data will be loaded client-side
    return {
        graphMetadata: {
            dataUrl: '/jsons/graph_data_optimized.json',
            expectedNodes: 10000, // approximate
            expectedLinks: 50000  // approximate
        }
    };
};