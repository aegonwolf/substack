<script lang="ts">
    import ForceGraph3DCats from "$lib/components/3d-networks/ForceGraph3DCats.svelte";
    import type { PageProps } from './$types';
    
    let { data } = $props<PageProps>();
</script>

<div class="h-screen w-screen fixed inset-0">
    <!-- Header overlay -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-blue-900/80 to-transparent backdrop-blur-sm">
        <h1 class="h2 text-white">Substack Category Network</h1>
        <p class="text-white opacity-90">Interactive category recommendation graph • Drag nodes to explore</p>
    </div>
    
    <!-- Full screen graph with Tailwind responsive sizing -->
    <div class="w-full h-full">
        <ForceGraph3DCats 
            graphData={data.graphData}
            categoryStats={data.categoryStats}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>