<script lang="ts">
    import { page } from '$app/stores';

    interface NavItem {
        href: string;
        label: string;
    }

    const navItems: NavItem[] = [
        { href: '/', label: 'Home' },
        { href: '/cats', label: 'Cats' },
        { href: '/graph', label: 'Graph' },
        { href: '/graph/cats', label: 'Graph Cats' },
        { href: '/graph/recommendation-map', label: 'Recommendation Map' }
    ];

    let mobileMenuOpen = false;

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }
</script>

<nav class="w-full">
    <div class="container mx-auto flex items-center justify-between p-4">
        <a href="/" class="h4 font-bold text-primary-600-400">subboom!</a>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex gap-4">
            {#each navItems as item}
                <a 
                    href={item.href} 
                    class="btn {$page.url.pathname === item.href ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
                >
                    {item.label}
                </a>
            {/each}
        </div>

        <!-- Mobile Hamburger Button -->
        <button 
            class="md:hidden btn preset-tonal-surface p-2"
            on:click={toggleMobileMenu}
            aria-label="Toggle menu"
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
        </button>
    </div>

    <!-- Mobile Navigation Menu -->
    {#if mobileMenuOpen}
        <div class="md:hidden bg-surface-100-900 border-t border-surface-300-700">
            <div class="container mx-auto p-4 space-y-2">
                {#each navItems as item}
                    <a 
                        href={item.href} 
                        class="block w-full text-left btn {$page.url.pathname === item.href ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
                        on:click={() => mobileMenuOpen = false}
                    >
                        {item.label}
                    </a>
                {/each}
            </div>
        </div>
    {/if}
</nav>
