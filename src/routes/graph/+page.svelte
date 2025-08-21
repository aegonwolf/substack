<script lang="ts">
    import ForceGraph3D from "$lib/components/3d-networks/ForceGraph3D.svelte";
    import type { PageProps } from './$types';
    import { Search } from '@lucide-svelte';
    
    let { data } = $props<PageProps>();
    
    // Search state
    let searchQuery = $state('');
    let searchResults = $state<any[]>([]);
    let isSearching = $state(false);
    let showDropdown = $state(false);
    
    // Reference to ForceGraph3D component
    let graphComponent: any;
    
    // Debounce timer
    let debounceTimer: NodeJS.Timeout;
    
    // Simple fuzzy search function
    function fuzzySearch(query: string, items: any[]) {
        const q = query.toLowerCase();
        return items
            .filter(item => {
                const name = (item.name || '').toLowerCase();
                return name.includes(q);
            })
            .sort((a, b) => {
                // Prioritize exact matches and starts-with
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                const aExact = aName === q;
                const bExact = bName === q;
                if (aExact && !bExact) return -1;
                if (bExact && !aExact) return 1;
                const aStarts = aName.startsWith(q);
                const bStarts = bName.startsWith(q);
                if (aStarts && !bStarts) return -1;
                if (bStarts && !aStarts) return 1;
                // Then sort by subscriber count
                return (b.subscriber_count || 0) - (a.subscriber_count || 0);
            })
            .slice(0, 8); // Limit results
    }
    
    // Handle search input
    function handleSearch(value: string) {
        searchQuery = value;
        
        clearTimeout(debounceTimer);
        
        if (!value.trim()) {
            searchResults = [];
            showDropdown = false;
            if (graphComponent?.clearHighlight) {
                graphComponent.clearHighlight();
            }
            return;
        }
        
        isSearching = true;
        showDropdown = true;
        
        debounceTimer = setTimeout(() => {
            searchResults = fuzzySearch(value, data.graphData.nodes);
            isSearching = false;
            
            // Highlight search results on the graph
            if (graphComponent?.highlightNodes) {
                const nodeIds = searchResults.map(n => n.id);
                graphComponent.highlightNodes(nodeIds);
            }
        }, 300);
    }
    
    // Handle selecting a node from search
    function selectNode(node: any) {
        searchQuery = node.name;
        showDropdown = false;
        
        // Highlight and focus the node
        if (graphComponent) {
            if (graphComponent.highlightNode) {
                graphComponent.highlightNode(node.id);
            }
            
            setTimeout(() => {
                if (graphComponent.focusNode) {
                    graphComponent.focusNode(node, 800, 140);
                }
            }, 100);
        }
    }
    
    // Handle clicks outside dropdown
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.search-container')) {
            showDropdown = false;
        }
    }
    
    // Format subscriber count for display
    function formatSubscribers(count: number | undefined) {
        if (!count) return '';
        if (count >= 1000) {
            return `${Math.round(count / 1000)}k`;
        }
        return count.toString();
    }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative w-full h-[calc(100vh-5rem)]">
    <!-- Search Bar -->
    <div class="search-container absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div class="relative">
            <!-- Search Input -->
            <div class="relative">
                <input
                    type="text"
                    value={searchQuery}
                    oninput={(e) => handleSearch(e.currentTarget.value)}
                    onfocus={() => searchQuery && (showDropdown = true)}
                    placeholder="Search newsletters..."
                    class="w-full px-12 py-3 rounded-lg bg-black/60 backdrop-blur-md 
                           border border-gray-600 text-white placeholder-gray-400
                           focus:outline-none focus:border-gray-400 focus:bg-black/80
                           transition-all duration-200"
                />
                
                <!-- Search Icon -->
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search class="w-5 h-5" />
                </div>
            </div>
            
            <!-- Search Results Dropdown -->
            {#if showDropdown && (searchResults.length > 0 || isSearching)}
                <div class="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-lg rounded-lg 
                            border border-gray-600 shadow-2xl overflow-hidden">
                    {#if isSearching}
                        <div class="px-4 py-3 text-gray-300 text-sm">
                            Searching...
                        </div>
                    {:else if searchResults.length > 0}
                        <ul class="max-h-96 overflow-y-auto">
                            {#each searchResults as node}
                                <li>
                                    <button
                                        onclick={() => selectNode(node)}
                                        class="w-full px-4 py-3 flex items-center justify-between
                                               hover:bg-gray-800 transition-colors duration-200
                                               border-b border-gray-700 last:border-0"
                                    >
                                        <div class="flex flex-col items-start">
                                            <span class="text-white font-medium">{node.name}</span>
                                            {#if node.category}
                                                <span class="text-gray-400 text-xs">{node.category}</span>
                                            {/if}
                                        </div>
                                        <div class="flex flex-col items-end gap-1">
                                            {#if node.subscriber_count}
                                                <span class="text-gray-400 text-sm">
                                                    {formatSubscribers(node.subscriber_count)} subscribers
                                                </span>
                                            {/if}
                                            {#if node.is_bestseller}
                                                <span class="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                                                    Bestseller
                                                </span>
                                            {/if}
                                        </div>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    
    <!-- Graph Component -->
    <div class="w-full h-full">
        <ForceGraph3D 
            bind:this={graphComponent}
            graphData={data.graphData}
            backgroundColor="#000000"
        />
    </div>
</div>

<style>
</style>