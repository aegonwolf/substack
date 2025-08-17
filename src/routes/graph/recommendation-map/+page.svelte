<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Map2d from '$lib/components/3d-networks/map2d.svelte';
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
    
    let graphData = $state<any>(null);
    let loading = $state(true);
    let loadError = $state<string | null>(null);
    let loadProgress = $state(0);
    
    // Load graph data client-side with progress tracking
    onMount(async () => {
        if (!browser) return;
        
        try {
            const response = await fetch(data.graphMetadata.dataUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load graph data: ${response.status}`);
            }
            
            // Get content length for progress tracking
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            // Read the response with progress
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Unable to read response');
            }
            
            const chunks: Uint8Array[] = [];
            let received = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                received += value.length;
                
                if (total) {
                    loadProgress = Math.round((received / total) * 100);
                }
            }
            
            // Combine chunks and parse JSON
            const chunksAll = new Uint8Array(received);
            let position = 0;
            for (const chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            
            const text = new TextDecoder('utf-8').decode(chunksAll);
            graphData = JSON.parse(text);
            
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
                    <h2 class="h3 mb-4">Loading 2D Recommendation Map...</h2>
                    <div class="w-64 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div 
                            class="h-full bg-primary-500 transition-all duration-300"
                            style="width: {loadProgress}%"
                        ></div>
                    </div>
                    <p class="mt-2 text-sm opacity-75">{loadProgress}% loaded</p>
                </div>
            </div>
        {:else if loadError}
            <div class="flex items-center justify-center h-full">
                <div class="preset-filled-error-800-200 rounded-lg p-8">
                    <h2 class="h3">Error Loading Map</h2>
                    <p class="mt-2">{loadError}</p>
                </div>
            </div>
        {:else if graphData}
            <Map2d 
                graphData={graphData}
                backgroundColor="#000000"
            />
        {/if}
    </div>
</div>

<style>
</style>