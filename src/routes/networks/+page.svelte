<script lang="ts">
  import { onMount } from 'svelte';
  import { loadRecommendationData, NetworkGraph } from '$lib/components/networks';
  import type { Publication, Recommendation } from '$lib/components/networks';

  let publications: any[] = []; // Temporarily use any[] to avoid type conflicts
  let recommendations: Recommendation[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const data = await loadRecommendationData();
      publications = data.publications;
      recommendations = data.recommendations;
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
      loading = false;
    }
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Network Graph Visualization</h1>
  
  {#if loading}
    <div class="text-center">
      <p>Loading recommendation data...</p>
    </div>
  {:else if error}
    <div class="alert variant-filled-error">
      <p>Error: {error}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-4">
        <h2 class="text-xl font-semibold mb-4">Publications Summary</h2>
        <div class="space-y-2">
          <p><strong>Total Publications:</strong> {publications.length}</p>
          <p><strong>Bestsellers:</strong> {publications.filter(p => p.is_bestseller).length}</p>
          <p><strong>Regular Publications:</strong> {publications.filter(p => !p.is_bestseller).length}</p>
          <p><strong>Total Recommendations:</strong> {recommendations.length}</p>
        </div>
      </div>
      
      <div class="card p-4">
        <h2 class="text-xl font-semibold mb-4">Sample Bestsellers</h2>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each publications.filter(p => p.is_bestseller).slice(0, 10) as publication}
            <div class="text-sm">
              <strong>{publication.name}</strong>
              <br>
              <span class="text-sm opacity-75">{publication.subscriber_count.toLocaleString()} subscribers</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <div class="card p-4 mt-6">
      <h2 class="text-xl font-semibold mb-4">Network Graph Visualization</h2>
      <div class="w-full h-96">
        <NetworkGraph {publications} {recommendations} width={800} height={400} />
      </div>
    </div>
    
    <!-- <div class="card p-4 mt-6">
      <h2 class="text-xl font-semibold mb-4">Sample Recommendations</h2>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#each recommendations.slice(0, 20) as recommendation}
          <div class="text-sm border-b pb-2">
            <strong>{publications.find(p => p.id === recommendation.recommender_id)?.name}</strong>
            recommends
            <strong>{publications.find(p => p.id === recommendation.recommended_id)?.name}</strong>
          </div>
        {/each}
      </div>
    </div> -->
  {/if}
</div>