<script lang="ts">
	import { page } from '$app/stores';

	interface NavItem {
		href: string;
		label: string;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Home' },
		{ href: '/cats', label: 'Cats' },
		// { href: '/graph', label: 'Graph' }, // stashed for now
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
		<div class="hidden items-center gap-4 md:flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="btn {$page.url.pathname === item.href
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface'}"
				>
					{item.label}
				</a>
			{/each}

			<!-- Substack Link -->
			<a
				href="https://substack.com/@blaustrom"
				target="_blank"
				rel="noopener noreferrer"
				class="btn flex items-center gap-2 preset-tonal-surface"
			>
				<img src="/substack.png" alt="Substack" class="h-5 w-5" />
				Follow me
			</a>
		</div>

		<!-- Mobile Hamburger Button -->
		<button
			class="btn preset-tonal-surface p-2 md:hidden"
			on:click={toggleMobileMenu}
			aria-label="Toggle menu"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
				/>
			</svg>
		</button>
	</div>

	<!-- Mobile Navigation Menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-surface-300-700 bg-surface-100-900 md:hidden">
			<div class="container mx-auto space-y-2 p-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="btn block w-full text-left {$page.url.pathname === item.href
							? 'preset-filled-primary-500'
							: 'preset-tonal-surface'}"
						on:click={() => (mobileMenuOpen = false)}
					>
						{item.label}
					</a>
				{/each}

				<!-- Mobile Substack Link -->
				<a
					href="https://substack.com/@blaustrom"
					target="_blank"
					rel="noopener noreferrer"
					class="btn flex w-full items-center gap-2 preset-tonal-surface"
					on:click={() => (mobileMenuOpen = false)}
				>
					<img src="/substack.png" alt="Substack" class="h-5 w-5" />
					Follow me on substack
				</a>
			</div>
		</div>
	{/if}
</nav>
