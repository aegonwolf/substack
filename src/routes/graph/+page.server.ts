import type { PageServerLoad } from './$types';
import graphData from '$lib/files/graph_data_optimized.json';

// ISR caching - cache for 1 hour
export const config = {
  isr: { 
    expiration: 3600 
  }
};

export const load: PageServerLoad = async () => {
    // Data is bundled at build time, no runtime fetch needed
    return {
        graphData
    };
};