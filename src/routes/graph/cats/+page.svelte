<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import ForceGraph3DCats from "$lib/components/3d-networks/ForceGraph3DCats.svelte";
    import type { PageProps } from './$types';
    
    let { data } = $props<PageProps>();
    
    let graphData = $state<any>(null);
    let loading = $state(true);
    let loadError = $state<string | null>(null);
    
    // Load graph data client-side
    onMount(async () => {
        if (!browser) return;
        
        try {
            const response = await fetch(data.graphMetadata.dataUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load graph data: ${response.status}`);
            }
            
            graphData = await response.json();
            loading = false;
        } catch (error) {
            console.error('Failed to load graph data:', error);
            loadError = error instanceof Error ? error.message : 'Failed to load graph data';
            loading = false;
        }
    });
</script>

<div class="w-full h-[calc(100vh-5rem)]">
    <!-- Full screen graph with Tailwind responsive sizing -->
    <div class="w-full h-full">
        {#if loading}
            <div class="flex items-center justify-center h-full">
                <div class="preset-filled-surface-100-900 rounded-lg p-8 text-center">
                    <h2 class="h3 mb-4">Loading Category Graph...</h2>
                    <p class="text-sm opacity-75">Preparing visualization</p>
                </div>
            </div>
        {:else if loadError}
            <div class="flex items-center justify-center h-full">
                <div class="preset-filled-error-800-200 rounded-lg p-8">
                    <h2 class="h3">Error Loading Graph</h2>
                    <p class="mt-2">{loadError}</p>
                </div>
            </div>
        {:else if graphData}
            <ForceGraph3DCats 
                graphData={graphData}
                categoryStats={data.categoryStats}
                backgroundColor="#000000"
            />
        {/if}
    </div>
</div>

<style>
</style>