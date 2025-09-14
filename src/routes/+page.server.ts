import type { PageServerLoad } from './$types';
// Import pre-merged data directly - no runtime processing needed!
import mergedData from '$lib/files/publications_merged.json';

// ISR caching - cache for 1 hour
export const config = {
  isr: { 
    expiration: 3600 
  }
};

export const load: PageServerLoad = async () => {
  // Return all publications data for full functionality
  return {
    publications: mergedData.publications,
    stats: mergedData.stats,
    totalCount: mergedData.publications.length
  };
};