<script lang="ts">
    import ForceGraph2D from "$lib/components/3d-networks/ForceGraph2D.svelte";
    import type { PageData } from './$types';
    
    let { data }: { data: PageData } = $props();
</script>

<div class="h-screen w-screen fixed inset-0">
    <!-- Header overlay -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 preset-glass-surface">
        <h1 class="h2 text-surface-950-50-token">2D Substack Recommendation Network</h1>
    </div>
    
    <!-- Full screen graph with Tailwind responsive sizing -->
    <div class="w-full h-full">
        <ForceGraph2D 
            graphData={data.graphData}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>