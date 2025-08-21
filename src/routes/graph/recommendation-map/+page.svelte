<script lang="ts">
    import Map2d from '$lib/components/3d-networks/map2d.svelte';
    import type { PageData } from './$types';
    import { Search, Rocket } from '@lucide/svelte';
    
    let { data }: { data: PageData } = $props();
    
    // Search state
    let searchQuery = $state('');
    let searchResults = $state<any[]>([]);
    let selectedNode = $state<any>(null);
    let isSearching = $state(false);
    let showDropdown = $state(false);
    
    // Reference to Map2d component
    let mapComponent: any;
    
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
            if (mapComponent?.clearHighlight) {
                mapComponent.clearHighlight();
            }
            return;
        }
        
        isSearching = true;
        showDropdown = true;
        
        debounceTimer = setTimeout(() => {
            searchResults = fuzzySearch(value, data.graphData.nodes);
            isSearching = false;
            
            // Highlight search results on the map
            if (mapComponent?.highlightNodes) {
                const nodeIds = searchResults.map(n => n.id);
                mapComponent.highlightNodes(nodeIds);
            }
        }, 300);
    }
    
    // Handle selecting a node from search
    function selectNode(node: any) {
        selectedNode = node;
        searchQuery = node.name;
        showDropdown = false;
        
        // Trigger the galaxy focus sequence
        if (mapComponent) {
            // First highlight just this node and its connections
            if (mapComponent.highlightNode) {
                mapComponent.highlightNode(node.id);
            }
            
            // Then focus after a delay for dramatic effect
            setTimeout(() => {
                if (mapComponent.focusNode) {
                    mapComponent.focusNode(node);
                }
            }, 500);
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
    <!-- Galaxy Search Bar -->
    <div class="search-container absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div class="relative">
            <!-- Search Input with Galaxy Theme -->
            <div class="galaxy-search-wrapper relative">
                <input
                    type="text"
                    value={searchQuery}
                    oninput={(e) => handleSearch(e.currentTarget.value)}
                    onfocus={() => searchQuery && (showDropdown = true)}
                    placeholder="Search the newsletter galaxy..."
                    class="galaxy-search-input w-full px-12 py-3 rounded-full bg-black/40 backdrop-blur-md 
                           border border-purple-500/30 text-white placeholder-purple-300/50
                           focus:outline-none focus:border-purple-400/60 focus:bg-black/60
                           transition-all duration-300"
                />
                
                <!-- Search Icon -->
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                    <Search class="w-5 h-5" />
                </div>
                
                <!-- Galaxy Icon -->
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400">
                    <Rocket class="w-5 h-5" />
                </div>
                
                <!-- Glow Effect -->
                <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-xl -z-10"></div>
            </div>
            
            <!-- Search Results Dropdown -->
            {#if showDropdown && (searchResults.length > 0 || isSearching)}
                <div class="absolute top-full mt-2 w-full bg-black/90 backdrop-blur-lg rounded-lg 
                            border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden">
                    {#if isSearching}
                        <div class="px-4 py-3 text-purple-300 text-sm">
                            Scanning the galaxy...
                        </div>
                    {:else if searchResults.length > 0}
                        <ul class="max-h-96 overflow-y-auto">
                            {#each searchResults as node}
                                <li>
                                    <button
                                        onclick={() => selectNode(node)}
                                        class="w-full px-4 py-3 flex items-center justify-between
                                               hover:bg-purple-500/10 transition-colors duration-200
                                               border-b border-purple-500/10 last:border-0"
                                    >
                                        <div class="flex flex-col items-start">
                                            <span class="text-white font-medium">{node.name}</span>
                                            {#if node.category}
                                                <span class="text-purple-300/70 text-xs">{node.category}</span>
                                            {/if}
                                        </div>
                                        <div class="flex flex-col items-end gap-1">
                                            {#if node.subscriber_count}
                                                <span class="text-purple-400 text-sm">
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
    
    <!-- Map Component -->
    <div class="w-full h-full">
        <Map2d 
            bind:this={mapComponent}
            graphData={data.graphData}
            backgroundColor="#000011"
        />
    </div>
</div>

<style>
    /* Galaxy theme animations */
    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: 0 0 20px rgba(147, 51, 234, 0.3),
                        0 0 40px rgba(147, 51, 234, 0.1);
        }
        50% {
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.5),
                        0 0 60px rgba(147, 51, 234, 0.2);
        }
    }
    
    .galaxy-search-input:focus {
        animation: pulse-glow 2s ease-in-out infinite;
    }
    
    /* Scrollbar styling for dropdown */
    .search-container :global(::-webkit-scrollbar) {
        width: 6px;
    }
    
    .search-container :global(::-webkit-scrollbar-track) {
        background: rgba(0, 0, 0, 0.3);
    }
    
    .search-container :global(::-webkit-scrollbar-thumb) {
        background: rgba(147, 51, 234, 0.5);
        border-radius: 3px;
    }
    
    .search-container :global(::-webkit-scrollbar-thumb:hover) {
        background: rgba(147, 51, 234, 0.7);
    }
</style>