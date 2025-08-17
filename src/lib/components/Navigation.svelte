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
</script>

<nav class="container mx-auto flex items-center justify-between p-4">
    <a href="/" class="h4 font-bold text-primary-600-300-token">Substack Analytics</a>
    <div class="flex gap-4">
        {#each navItems as item}
            <a 
                href={item.href} 
                class="btn {$page.url.pathname === item.href ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
            >
                {item.label}
            </a>
        {/each}
    </div>
</nav>
