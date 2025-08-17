<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Navigation Header -->
<header class="shadow-sm shadow-primary-100-900/50">
	<Navigation />
</header>

<!-- Main Content -->
<main class="min-h-screen">
	{@render children?.()}
</main>
