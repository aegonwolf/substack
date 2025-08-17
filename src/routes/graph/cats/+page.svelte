<script lang="ts">
    import ForceGraph3DCats from "$lib/components/3d-networks/ForceGraph3DCats.svelte";
    import type { PageProps } from './$types';
    
    let { data } = $props<PageProps>();
</script>

<div class="w-full h-[calc(100vh-5rem)]">
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