<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Navigation Header -->
<header class="preset-tonal-surface border-b border-surface-300-600-token">
	<nav class="container mx-auto flex items-center justify-between p-4">
		<a href="/" class="h4 font-bold text-primary-600-300-token">Substack Analytics</a>
		<div class="flex gap-4">
			<a 
				href="/" 
				class="btn {$page.url.pathname === '/' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			>
				Dashboard
			</a>
			<a 
				href="/graph/2D" 
				class="btn {$page.url.pathname === '/graph/2D' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			>
				2D Network
			</a>
			<a 
				href="/graph" 
				class="btn {$page.url.pathname === '/graph' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			>
				3D Network
			</a>
		</div>
	</nav>
</header>

<!-- Main Content -->
<main class="min-h-screen">
	{@render children?.()}
</main>
