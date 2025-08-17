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
  // Just return the pre-computed data - no processing at all!
  return mergedData;
};