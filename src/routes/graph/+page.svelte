<script lang="ts">
    import ForceGraph3D from "$lib/components/3d-networks/ForceGraph3D.svelte";
    import type { PageProps } from './$types';
    
    let { data } = $props<PageProps>();
</script>

<div class="w-full h-[calc(100vh-5rem)]">
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