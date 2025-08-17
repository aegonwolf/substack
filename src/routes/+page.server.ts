import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Publication } from '$lib/types';

// ISR caching - cache for 1 hour
export const config = {
  isr: { 
    expiration: 3600 
  }
};

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    // Load subscriber data - no validation, trust the JSON
    const subscriberResponse = await fetch('/jsons/subscriber_counts.json');
    if (!subscriberResponse.ok) {
      throw error(500, 'Unable to load publication data');
    }
    const publications: Publication[] = await subscriberResponse.json();
    
    // Load recommendation counts
    let recommendationCountsData: any[] = [];
    try {
      const recResponse = await fetch('/jsons/recommendation_counts.json');
      if (recResponse.ok) {
        recommendationCountsData = await recResponse.json();
      }
    } catch {
      // Silent fail - just use empty recommendations
    }
    
    // Create recommendation map
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
    
    // Merge recommendation counts with publications
    const publicationsWithRecommendations = publications.map(pub => {
      const recCounts = recommendationCountsMap.get(pub.publication_url) || {incoming: 0, outgoing: 0, total: 0};
      return {
        ...pub,
        recommendation_count: recCounts.outgoing,
        incoming_recommendations: recCounts.incoming,
        outgoing_recommendations: recCounts.outgoing,
        total_recommendations: recCounts.total
      };
    });
    
    // Basic stats without validation
    const categories = Array.from(new Set(publications.map(p => p.category))).sort();
    const boardTypes = Array.from(new Set(publications.map(p => p.board))).filter(Boolean).sort();
    
    return {
      publications: publicationsWithRecommendations,
      stats: {
        total: publications.length,
        validCount: publications.length,
        invalidCount: 0,
        categories,
        boardTypes
      }
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to load publication data');
  }
};