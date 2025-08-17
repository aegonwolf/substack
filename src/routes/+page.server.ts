import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Publication } from '$lib/types';
import { validatePublicationData } from '$lib/utils';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    let rawData: string;
    try {
      const response = await fetch('/jsons/subscriber_counts.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch subscriber_counts.json: ${response.status}`);
      }
      rawData = await response.text();
    } catch (fileError) {
      console.error('Failed to read subscriber data file:', fileError);
      throw error(500, 'Unable to load publication data file');
    }
    
    let recommendationCountsData: any[] = [];
    try {
      const response = await fetch('/jsons/recommendation_counts.json');
      if (response.ok) {
        recommendationCountsData = await response.json();
      }
    } catch (recommendationsError) {
      console.error('Failed to read recommendation counts data file:', recommendationsError);
      // Don't throw error, just use empty recommendations
    }
    
    let jsonData: any;
    try {
      jsonData = JSON.parse(rawData);
    } catch (parseError) {
      console.error('Failed to parse subscriber data JSON:', parseError);
      throw error(500, 'Invalid publication data format');
    }
    
    if (!Array.isArray(jsonData)) {
      console.error('Data is not an array, received:', typeof jsonData);
      throw error(500, 'Publication data must be an array');
    }
    
    const validation = validatePublicationData(jsonData);
    
    if (validation.invalid.length > 0) {
      validation.invalid.forEach((item, index) => {
        if (index < 5) { // Only log first 5 invalid entries to avoid spam
          console.log('Invalid publication entry found:', item);
        }
      });
    }
    
    if (validation.valid.length === 0) {
      throw error(500, 'No valid publication data available');
    }
    
    // Create a map of publication URL to recommendation counts
    const recommendationCountsMap = new Map<string, {incoming: number, outgoing: number, total: number}>();
    recommendationCountsData.forEach(item => {
      if (item.publication_url) {
        recommendationCountsMap.set(item.publication_url, {
          incoming: item.incoming_recommendations || 0,
          outgoing: item.outgoing_recommendations || 0,
          total: item.total_recommendations || 0
        });
      }
    });
    
    // Add recommendation counts to publications
    const publicationsWithRecommendations = validation.valid.map(pub => {
      const recCounts = recommendationCountsMap.get(pub.publication_url) || {incoming: 0, outgoing: 0, total: 0};
      return {
        ...pub,
        recommendation_count: recCounts.outgoing, // Show outgoing recommendations since incoming are mostly 0
        incoming_recommendations: recCounts.incoming,
        outgoing_recommendations: recCounts.outgoing,
        total_recommendations: recCounts.total
      };
    });
    
    return {
      publications: publicationsWithRecommendations,
      stats: validation.stats
    };
  } catch (err) {
    // Re-throw SvelteKit errors
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    
    // Handle unexpected errors
    console.error('Unexpected error loading publication data:', err);
    throw error(500, 'Failed to load publication data');
  }
};