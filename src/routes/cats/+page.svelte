<script lang="ts">
	import type { PageData } from './$types';
	import type { CategoryData } from './+page.server';
	import { formatSubscriberCount } from '$lib/utils';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	// Icons for pagination
	import { ArrowLeft, ArrowRight, Ellipsis, ChevronsLeft, ChevronsRight } from '@lucide/svelte';

	// Props using Svelte 5 runes syntax
	const { data }: { data: PageData } = $props();

	// Reactive state management with Svelte 5 runes
	let sortBy = $state<'mean' | 'median' | 'min' | 'max' | 'stddev' | 'outgoing' | 'incoming'>('mean');

	// Pagination state
	let currentPage = $state(1);
	let pageSize = $state(25);

	// Computed sorted data based on current sort selection
	const sortedData = $derived.by(() => {
		if (!data?.categories) {
			return [];
		}

		const sorted = [...data.categories];
		
		switch (sortBy) {
			case 'mean':
				return sorted.sort((a, b) => b.mean_subscriber_count - a.mean_subscriber_count);
			case 'median':
				return sorted.sort((a, b) => b.median_subscriber_count - a.median_subscriber_count);
			case 'min':
				return sorted.sort((a, b) => b.min_subscriber_count - a.min_subscriber_count);
			case 'max':
				return sorted.sort((a, b) => b.max_subscriber_count - a.max_subscriber_count);
			case 'stddev':
				return sorted.sort((a, b) => b.stddev_subscriber_count - a.stddev_subscriber_count);
			case 'outgoing':
				return sorted.sort((a, b) => b.outgoing - a.outgoing);
			case 'incoming':
				return sorted.sort((a, b) => b.incoming - a.incoming);
			default:
				return sorted;
		}
	});

	// Paginated data derived from sorted data
	const paginatedData = $derived.by(() => {
		const startIndex = (currentPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		return sortedData.slice(startIndex, endIndex);
	});

	// Reset to first page when sort changes
	$effect(() => {
		sortBy;
		currentPage = 1;
	});

	// Loading and error states
	const isLoading = $derived(!data);
	const hasError = $derived(data && !data.categories);

	// Accessibility: Handle keyboard navigation for sort controls
	function handleSortKeydown(event: KeyboardEvent, sortType: typeof sortBy) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			sortBy = sortType;
		}
	}
</script>

<!-- Main Dashboard Layout -->
<div class="container mx-auto max-w-7xl space-y-8 p-4">
	<!-- Header Section -->
	<header class="space-y-4 text-center">
		<h1 class="gradient-heading h1">Category Analytics Dashboard</h1>
		<p class="text-surface-600-300-token text-lg">
			Explore Substack categories ranked by subscriber metrics and recommendation patterns
		</p>
	</header>

	<!-- Loading State -->
	{#if isLoading}
		<div
			class="flex flex-col items-center justify-center space-y-6 py-16"
			role="status"
			aria-live="polite"
		>
			<div class="bg-surface-300-600-token placeholder-circle h-20 w-20 animate-pulse"></div>
			<div class="space-y-2 text-center">
				<p class="text-surface-700-200-token text-lg font-medium">Loading category data...</p>
				<p class="text-surface-500-400-token text-sm">
					Please wait while we fetch the latest analytics
				</p>
			</div>
		</div>
	{:else if hasError}
		<!-- Error State -->
		<div
			class="space-y-4 card preset-filled-error-500 p-8 text-center"
			role="alert"
			aria-live="assertive"
		>
			<div class="text-6xl">⚠️</div>
			<h2 class="h3 text-white">Error Loading Data</h2>
			<p class="text-error-100">
				Unable to load category data. Please check your connection and try refreshing the page.
			</p>
			<button
				class="btn preset-filled-surface-100-900 transition-all duration-200 hover:preset-filled-surface-200-800"
				onclick={() => window.location.reload()}
				aria-label="Refresh page to reload data"
			>
				Refresh Page
			</button>
		</div>
	{:else}
		<!-- Main Content Area -->
		<main class="space-y-8">
			<!-- Statistics Cards -->
			<section class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div class="card preset-tonal-surface p-6 shadow-lg">
					<h3 class="text-surface-800-100-token h4 mb-2">Total Categories</h3>
					<p class="text-3xl font-bold text-primary-600-300-token">{data.stats?.totalCategories || 0}</p>
				</div>
				<div class="card preset-tonal-surface p-6 shadow-lg">
					<h3 class="text-surface-800-100-token h4 mb-2">Total Outgoing</h3>
					<p class="text-3xl font-bold text-warning-600-300-token">{formatSubscriberCount(data.stats?.totalOutgoing || 0)}</p>
				</div>
				<div class="card preset-tonal-surface p-6 shadow-lg">
					<h3 class="text-surface-800-100-token h4 mb-2">Total Incoming</h3>
					<p class="text-3xl font-bold text-success-600-300-token">{formatSubscriberCount(data.stats?.totalIncoming || 0)}</p>
				</div>
			</section>

			<!-- Sort Controls Section -->
			<section class="card preset-tonal-surface p-6 shadow-lg" aria-labelledby="sort-heading">
				<h2 id="sort-heading" class="text-surface-900-50-token mb-6 h3">Sort Categories</h2>
				<div class="flex flex-wrap gap-3">
					<!-- Sort Buttons -->
					<button
						class="btn transition-all duration-200 {sortBy === 'mean'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'mean')}
						onkeydown={(e) => handleSortKeydown(e, 'mean')}
						aria-label="Sort by mean subscriber count"
					>
						Mean Subscribers
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'median'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'median')}
						onkeydown={(e) => handleSortKeydown(e, 'median')}
						aria-label="Sort by median subscriber count"
					>
						Median Subscribers
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'min'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'min')}
						onkeydown={(e) => handleSortKeydown(e, 'min')}
						aria-label="Sort by minimum subscriber count"
					>
						Min Subscribers
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'max'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'max')}
						onkeydown={(e) => handleSortKeydown(e, 'max')}
						aria-label="Sort by maximum subscriber count"
					>
						Max Subscribers
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'stddev'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'stddev')}
						onkeydown={(e) => handleSortKeydown(e, 'stddev')}
						aria-label="Sort by standard deviation"
					>
						Std Deviation
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'outgoing'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'outgoing')}
						onkeydown={(e) => handleSortKeydown(e, 'outgoing')}
						aria-label="Sort by outgoing recommendations"
					>
						Outgoing Recs
					</button>
					<button
						class="btn transition-all duration-200 {sortBy === 'incoming'
							? 'preset-filled-primary-500 shadow-md'
							: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
						onclick={() => (sortBy = 'incoming')}
						onkeydown={(e) => handleSortKeydown(e, 'incoming')}
						aria-label="Sort by incoming recommendations"
					>
						Incoming Recs
					</button>
				</div>
				<p class="text-surface-500-400-token mt-3 text-sm">
					Currently sorting by: <span class="font-medium">{sortBy === 'mean' ? 'Mean Subscribers' : sortBy === 'median' ? 'Median Subscribers' : sortBy === 'min' ? 'Min Subscribers' : sortBy === 'max' ? 'Max Subscribers' : sortBy === 'stddev' ? 'Standard Deviation' : sortBy === 'outgoing' ? 'Outgoing Recommendations' : 'Incoming Recommendations'}</span>
				</p>
			</section>

			<!-- Category Leaderboard Table Section -->
			<section class="card shadow-xl" aria-labelledby="rankings-heading">
				<header class="card-header preset-tonal-primary p-6">
					<h2 id="rankings-heading" class="text-primary-900-50-token h3">Category Rankings</h2>
					<div class="mt-2">
						<p class="text-primary-700-200-token">
							{sortedData.length} categories • Sorted by {sortBy}
						</p>
					</div>
				</header>

				{#if sortedData.length === 0}
					<!-- No Results State -->
					<div class="space-y-4 p-12 text-center" role="status" aria-live="polite">
						<div class="text-6xl opacity-50">📊</div>
						<h3 class="text-surface-700-200-token h4">No Categories Found</h3>
						<p class="text-surface-500-400-token mx-auto max-w-md">
							No category data available at this time.
						</p>
					</div>
				{:else}
					<!-- Desktop Table -->
					<div class="hidden p-6 md:block">
						<div class="table-container">
							<table class="table-hover table" aria-label="Category leaderboard rankings">
								<thead>
									<tr class="preset-tonal-surface">
										<th class="text-surface-800-100-token text-left font-semibold" scope="col">
											<span class="flex items-center gap-2"> Rank </span>
										</th>
										<th class="text-surface-800-100-token text-left font-semibold" scope="col">
											<span class="flex items-center gap-2"> Category </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Mean </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Median </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Min </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Max </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Std Dev </span>
										</th>
										<th class="text-surface-800-100-token text-center font-semibold" scope="col">
											<span class="flex items-center justify-center gap-2"> Recommendations </span>
										</th>
									</tr>
								</thead>
								<tbody>
									{#each paginatedData as category, index}
										<tr class="group transition-all duration-200 hover:preset-tonal-primary">
											<td class="text-lg font-bold">
												<span class="flex items-center gap-2">
													#{(currentPage - 1) * pageSize + index + 1}
												</span>
											</td>
											<td>
												<span class="font-medium text-primary-600-300-token capitalize">
													{category.category}
												</span>
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(Math.round(category.mean_subscriber_count))}
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(Math.round(category.median_subscriber_count))}
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(category.min_subscriber_count)}
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(category.max_subscriber_count)}
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(Math.round(category.stddev_subscriber_count))}
											</td>
											<td class="text-surface-600-300-token text-center font-mono">
												<div class="flex gap-1 justify-center">
													<span class="badge preset-tonal-success text-xs" title="Incoming recommendations">
														↓{formatSubscriberCount(category.incoming)}
													</span>
													<span class="badge preset-tonal-warning text-xs" title="Outgoing recommendations">
														↑{formatSubscriberCount(category.outgoing)}
													</span>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Mobile Card Layout -->
					<div class="space-y-4 p-6 md:hidden">
						{#each paginatedData as category, index}
							{@const absoluteIndex = (currentPage - 1) * pageSize + index}
							<div
								class="card preset-tonal-surface p-5 shadow-md transition-all duration-300 hover:preset-tonal-primary hover:shadow-lg"
							>
								<div class="mb-3 flex items-start justify-between">
									<div class="flex items-center gap-2">
										{#if absoluteIndex < 3}
											<span class="text-xl">
												{absoluteIndex === 0 ? '🥇' : absoluteIndex === 1 ? '🥈' : '🥉'}
											</span>
										{/if}
										<span class="badge preset-filled-secondary-500 text-sm font-bold">
											#{absoluteIndex + 1}
										</span>
									</div>
								</div>

								<h3 class="text-primary-600-300-token mb-3 text-lg font-bold capitalize">
									{category.category}
								</h3>

								<div class="space-y-3">
									<div class="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span class="text-surface-500-400-token block">Mean Subscribers</span>
											<span class="font-mono font-semibold">{formatSubscriberCount(Math.round(category.mean_subscriber_count))}</span>
										</div>
										<div>
											<span class="text-surface-500-400-token block">Median Subscribers</span>
											<span class="font-mono font-semibold">{formatSubscriberCount(Math.round(category.median_subscriber_count))}</span>
										</div>
										<div>
											<span class="text-surface-500-400-token block">Min Subscribers</span>
											<span class="font-mono font-semibold">{formatSubscriberCount(category.min_subscriber_count)}</span>
										</div>
										<div>
											<span class="text-surface-500-400-token block">Max Subscribers</span>
											<span class="font-mono font-semibold">{formatSubscriberCount(category.max_subscriber_count)}</span>
										</div>
									</div>
									<div class="mt-3">
										<span class="text-surface-500-400-token block text-sm">Recommendations</span>
										<div class="flex gap-1 mt-1">
											<span class="badge preset-tonal-success text-xs" title="Incoming recommendations">
												↓{formatSubscriberCount(category.incoming)}
											</span>
											<span class="badge preset-tonal-warning text-xs" title="Outgoing recommendations">
												↑{formatSubscriberCount(category.outgoing)}
											</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Pagination Controls -->
				{#if sortedData.length > 0}
					<section class="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
						<!-- Page Size Selector -->
						<div class="flex items-center gap-3">
							<label for="page-size" class="text-surface-800-100-token text-sm font-medium">
								Items per page:
							</label>
							<select
								id="page-size"
								class="select max-w-[120px] text-sm"
								bind:value={pageSize}
								onchange={() => (currentPage = 1)}
							>
								<option value={10}>10</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
							</select>
						</div>

						<!-- Pagination Component -->
						<div class="flex-1 flex justify-center md:justify-end">
							<Pagination
								data={sortedData}
								page={currentPage}
								onPageChange={(e) => (currentPage = e.page)}
								pageSize={pageSize}
								onPageSizeChange={(e) => (pageSize = e.pageSize)}
								siblingCount={1}
								showFirstLastButtons={true}
								classes="flex items-center gap-1"
							>
								{#snippet labelEllipsis()}<Ellipsis class="size-4" />{/snippet}
								{#snippet labelNext()}<ArrowRight class="size-4" />{/snippet}
								{#snippet labelPrevious()}<ArrowLeft class="size-4" />{/snippet}
								{#snippet labelFirst()}<ChevronsLeft class="size-4" />{/snippet}
								{#snippet labelLast()}<ChevronsRight class="size-4" />{/snippet}
							</Pagination>
						</div>

						<!-- Results Info -->
						<div class="text-surface-600-300-token text-sm">
							Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}-{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} categories
						</div>
					</section>
				{/if}
			</section>
		</main>

		<!-- Footer Section -->
		<footer class="mt-16 space-y-4 text-center">
			<div class="mx-auto max-w-2xl card preset-tonal-surface p-6">
				<p class="text-surface-600-300-token text-sm">
					📊 Category analytics from Substack publication data
					{#if data?.stats}
						<br />
						<span class="text-surface-700-200-token font-medium">
							{data.stats.totalCategories} categories analyzed
						</span>
					{/if}
				</p>
				<div class="text-surface-500-400-token mt-4 flex justify-center gap-4 text-xs">
					<span>🔄 Updated regularly</span>
					<span>•</span>
					<span>📱 Mobile optimized</span>
					<span>•</span>
					<span>♿ Accessible design</span>
				</div>
			</div>
		</footer>
	{/if}
</div>

<style>
	/* Custom gradient heading */
	.gradient-heading {
		background: linear-gradient(
			135deg,
			var(--color-primary-500),
			var(--color-secondary-500),
			var(--color-tertiary-500)
		);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-size: 200% 200%;
		animation: gradient-shift 4s ease-in-out infinite;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	/* Enhanced focus styles for better accessibility */
	.select:focus,
	.btn:focus {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	/* Smooth loading animation */
	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	.placeholder-circle {
		animation: pulse-glow 2s ease-in-out infinite;
	}

	/* Mobile card hover enhancement */
	@media (max-width: 768px) {
		.card:hover {
			transform: translateY(-2px);
		}
	}

	/* Loading state improvements */
	[role='status'] {
		min-height: 200px;
	}

	/* Badge animations */
	.badge {
		transition: all 0.2s ease-in-out;
	}

	.badge:hover {
		transform: scale(1.05);
	}
</style>