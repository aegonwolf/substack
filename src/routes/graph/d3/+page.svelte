<script lang="ts">
    import Map2d from '$lib/components/3d-networks/map2d.svelte';
    
    let { data }: { data: PageData } = $props();
</script>

<div class="h-screen w-screen fixed inset-0">
    <!-- Header overlay -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 preset-glass-surface">
        <h1 class="h2 text-surface-950-50-token">2D Substack Recommendation Network</h1>
    </div>
    
    <!-- Full screen graph with Tailwind responsive sizing -->
    <div class="w-full h-full">
        <Map2d 
            graphData={data.graphData}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>