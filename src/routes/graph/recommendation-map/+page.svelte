<script lang="ts">
    import Map2d from '$lib/components/3d-networks/map2d.svelte';
    import type { PageData } from './$types';
    
    // Disable SSR - no serialization overhead!
    export const ssr = false;
    
    let { data }: { data: PageData } = $props();
</script>

<div class="w-full h-[calc(100vh-5rem)]">
    <div class="w-full h-full">
        <Map2d 
            graphData={data.graphData}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>