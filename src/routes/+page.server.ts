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
  // Return only essential data for SSR (reduce serialization overhead)
  // Client will fetch full dataset if needed
  return {
    // Only top 100 publications for initial render
    publications: mergedData.publications.slice(0, 100),
    stats: mergedData.stats,
    // Flag to indicate more data available
    hasMore: mergedData.publications.length > 100,
    totalCount: mergedData.publications.length
  };
};