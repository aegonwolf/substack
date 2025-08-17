import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Return minimal data - graph will be loaded client-side
    return {
        // Just return metadata about the graph, not the actual data
        graphMetadata: {
            dataUrl: '/jsons/graph_data_optimized.json',
            expectedNodes: 10000, // approximate
            expectedLinks: 50000  // approximate
        }
    };
};