<script lang="ts">
    import ForceGraph3D from "$lib/components/3d-networks/ForceGraph3D.svelte";
    import type { PageProps } from './$types';
    
    let { data } = $props<PageProps>();
</script>

<div class="h-screen w-screen fixed inset-0">
    <!-- Header overlay -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <h1 class="h2 text-white">Substack Category Network</h1>
        <p class="text-white opacity-80">Categories and their publications</p>
    </div>
    
    <!-- Full screen graph with Tailwind responsive sizing -->
    <div class="w-full h-full">
        <ForceGraph3D 
            graphData={data.graphData}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>