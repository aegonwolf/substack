import type { PageServerLoad } from './$types';
import graphData from '$lib/files/category_graph_data_optimized.json';
import categoryStats from '$lib/files/categories.json';

// ISR caching - cache for 1 hour
export const config = {
  isr: { 
    expiration: 3600 
  }
};

export const load: PageServerLoad = async () => {
    // Both files are bundled at build time
    return {
        graphData,
        categoryStats
    };
};