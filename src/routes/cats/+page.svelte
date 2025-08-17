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
	let sortBy = $state<'mean' | 'median' | 'min' | 'max' | 'stddev' | 'outgoing' | 'incoming'>(
		'mean'
	);
	let sortDirection = $state<'desc' | 'asc'>('desc'); // Default to descending (highest first)

	// Pagination state
	let currentPage = $state(1);
	let pageSize = $state(25);

	// Computed sorted data based on current sort selection
	const sortedData = $derived.by(() => {
		if (!data?.categories) {
			return [];
		}

		const sorted = [...data.categories];
		const multiplier = sortDirection === 'desc' ? -1 : 1;

		switch (sortBy) {
			case 'mean':
				return sorted.sort(
					(a, b) => multiplier * (b.mean_subscriber_count - a.mean_subscriber_count)
				);
			case 'median':
				return sorted.sort(
					(a, b) => multiplier * (b.median_subscriber_count - a.median_subscriber_count)
				);
			case 'min':
				return sorted.sort(
					(a, b) => multiplier * (b.min_subscriber_count - a.min_subscriber_count)
				);
			case 'max':
				return sorted.sort(
					(a, b) => multiplier * (b.max_subscriber_count - a.max_subscriber_count)
				);
			case 'stddev':
				return sorted.sort(
					(a, b) => multiplier * (b.stddev_subscriber_count - a.stddev_subscriber_count)
				);
			case 'outgoing':
				return sorted.sort((a, b) => multiplier * (b.outgoing - a.outgoing));
			case 'incoming':
				return sorted.sort((a, b) => multiplier * (b.incoming - a.incoming));
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
		sortDirection;
		currentPage = 1;
	});

	// Loading and error states
	const isLoading = $derived(!data);
	const hasError = $derived(data && !data.categories);

	// Handle sort column click - toggle direction if same column, otherwise set new column
	function handleSort(newSortBy: typeof sortBy) {
		if (sortBy === newSortBy) {
			// Toggle direction if clicking the same column
			sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
		} else {
			// Set new column and default to descending
			sortBy = newSortBy;
			sortDirection = 'desc';
		}
	}

	// Accessibility: Handle keyboard navigation for sort controls
	function handleSortKeydown(event: KeyboardEvent, sortType: typeof sortBy) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSort(sortType);
		}
	}
</script>

<!-- Main Dashboard Layout -->
<div class="container mx-auto max-w-7xl space-y-6 px-4 py-4 md:space-y-8 md:px-6">
	<!-- Header Section -->
	<header class="space-y-4 text-center px-2">
		<h1 class="gradient-heading h1 leading-tight">Category Analytics Dashboard</h1>
		<p class="text-surface-600-300-token text-base md:text-lg leading-relaxed">
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
			<section class="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
				<div class="card preset-tonal-surface p-4 md:p-6 shadow-lg">
					<h3 class="text-surface-800-100-token mb-2 h5 md:h4">Total Categories</h3>
					<p class="text-primary-600-300-token text-2xl md:text-3xl font-bold">
						{data.stats?.totalCategories || 0}
					</p>
				</div>
				<div class="card preset-tonal-surface p-4 md:p-6 shadow-lg">
					<h3 class="text-surface-800-100-token mb-2 h5 md:h4">Total Outgoing</h3>
					<p class="text-warning-600-300-token text-2xl md:text-3xl font-bold">
						{formatSubscriberCount(data.stats?.totalOutgoing || 0)}
					</p>
				</div>
				<div class="card preset-tonal-surface p-4 md:p-6 shadow-lg">
					<h3 class="text-surface-800-100-token mb-2 h5 md:h4">Total Incoming</h3>
					<p class="text-success-600-300-token text-2xl md:text-3xl font-bold">
						{formatSubscriberCount(data.stats?.totalIncoming || 0)}
					</p>
				</div>
			</section>

			<!-- Category Leaderboard Table Section -->
			<section class="card shadow-xl" aria-labelledby="rankings-heading">
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
					<!-- Mobile Sort Controls -->
					<div class="md:hidden p-4 border-b border-surface-300-700">
						<div class="space-y-3">
							<label class="text-surface-800-100-token text-sm font-medium" for="mobile-sort">
								Sort by:
							</label>
							<div class="flex gap-2">
								<select
									id="mobile-sort"
									class="select flex-1 text-sm"
									bind:value={sortBy}
								>
									<option value="mean">Mean Subscribers</option>
									<option value="median">Median Subscribers</option>
									<option value="min">Min Subscribers</option>
									<option value="max">Max Subscribers</option>
									<option value="stddev">Standard Deviation</option>
									<option value="incoming">Incoming Recommendations</option>
									<option value="outgoing">Outgoing Recommendations</option>
								</select>
								<button
									class="btn preset-tonal-surface px-3 py-2"
									onclick={() => sortDirection = sortDirection === 'desc' ? 'asc' : 'desc'}
									aria-label="Toggle sort direction"
								>
									{sortDirection === 'desc' ? '↓' : '↑'}
								</button>
							</div>
						</div>
					</div>

					<!-- Desktop Table -->
					<div class="hidden p-4 md:p-6 md:block">
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
											<button
												class="hover:text-primary-600-300-token flex w-full items-center justify-end gap-2 text-right transition-colors duration-200 {sortBy ===
												'mean'
													? 'text-primary-600-300-token'
													: ''}"
												onclick={() => handleSort('mean')}
												onkeydown={(e) => handleSortKeydown(e, 'mean')}
												aria-label="Sort by mean subscriber count"
											>
												Mean {sortBy === 'mean' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
											</button>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<button
												class="hover:text-primary-600-300-token flex w-full items-center justify-end gap-2 text-right transition-colors duration-200 {sortBy ===
												'median'
													? 'text-primary-600-300-token'
													: ''}"
												onclick={() => handleSort('median')}
												onkeydown={(e) => handleSortKeydown(e, 'median')}
												aria-label="Sort by median subscriber count"
											>
												Median {sortBy === 'median' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
											</button>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<button
												class="hover:text-primary-600-300-token flex w-full items-center justify-end gap-2 text-right transition-colors duration-200 {sortBy ===
												'min'
													? 'text-primary-600-300-token'
													: ''}"
												onclick={() => handleSort('min')}
												onkeydown={(e) => handleSortKeydown(e, 'min')}
												aria-label="Sort by minimum subscriber count"
											>
												Min {sortBy === 'min' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
											</button>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<button
												class="hover:text-primary-600-300-token flex w-full items-center justify-end gap-2 text-right transition-colors duration-200 {sortBy ===
												'max'
													? 'text-primary-600-300-token'
													: ''}"
												onclick={() => handleSort('max')}
												onkeydown={(e) => handleSortKeydown(e, 'max')}
												aria-label="Sort by maximum subscriber count"
											>
												Max {sortBy === 'max' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
											</button>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<button
												class="hover:text-primary-600-300-token flex w-full items-center justify-end gap-2 text-right transition-colors duration-200 {sortBy ===
												'stddev'
													? 'text-primary-600-300-token'
													: ''}"
												onclick={() => handleSort('stddev')}
												onkeydown={(e) => handleSortKeydown(e, 'stddev')}
												aria-label="Sort by standard deviation"
											>
												Std Dev {sortBy === 'stddev' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
											</button>
										</th>
										<th class="text-surface-800-100-token text-center font-semibold" scope="col">
											<div class="flex items-center justify-center gap-2">
												<button
													class="hover:text-primary-600-300-token transition-colors duration-200 {sortBy ===
													'incoming'
														? 'text-primary-600-300-token'
														: ''}"
													onclick={() => handleSort('incoming')}
													onkeydown={(e) => handleSortKeydown(e, 'incoming')}
													aria-label="Sort by incoming recommendations"
													title="Sort by incoming recommendations"
												>
													↓In {sortBy === 'incoming' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
												</button>
												<span class="text-surface-500-400-token">|</span>
												<button
													class="hover:text-primary-600-300-token transition-colors duration-200 {sortBy ===
													'outgoing'
														? 'text-primary-600-300-token'
														: ''}"
													onclick={() => handleSort('outgoing')}
													onkeydown={(e) => handleSortKeydown(e, 'outgoing')}
													aria-label="Sort by outgoing recommendations"
													title="Sort by outgoing recommendations"
												>
													↑Out {sortBy === 'outgoing' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
												</button>
											</div>
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
												<span class="text-primary-600-300-token font-medium capitalize">
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
												<div class="flex justify-center gap-1">
													<span
														class="badge preset-tonal-success text-xs"
														title="Incoming recommendations"
													>
														↓{formatSubscriberCount(category.incoming)}
													</span>
													<span
														class="badge preset-tonal-warning text-xs"
														title="Outgoing recommendations"
													>
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
					<div class="space-y-3 p-4 md:hidden">
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
									<!-- Primary Metrics -->
									<div class="grid grid-cols-2 gap-2 text-sm">
										<div class="bg-surface-50-950 rounded-lg p-2">
											<span class="text-surface-500-400-token text-xs block">Mean</span>
											<span class="font-mono font-bold text-sm"
												>{formatSubscriberCount(Math.round(category.mean_subscriber_count))}</span
											>
										</div>
										<div class="bg-surface-50-950 rounded-lg p-2">
											<span class="text-surface-500-400-token text-xs block">Median</span>
											<span class="font-mono font-bold text-sm"
												>{formatSubscriberCount(Math.round(category.median_subscriber_count))}</span
											>
										</div>
									</div>
									<!-- Range Metrics -->
									<div class="grid grid-cols-2 gap-2 text-sm">
										<div>
											<span class="text-surface-500-400-token text-xs block">Min - Max</span>
											<span class="font-mono text-xs">
												{formatSubscriberCount(category.min_subscriber_count)} - {formatSubscriberCount(category.max_subscriber_count)}
											</span>
										</div>
										<div>
											<span class="text-surface-500-400-token text-xs block">Std Dev</span>
											<span class="font-mono text-xs">
												{formatSubscriberCount(Math.round(category.stddev_subscriber_count))}
											</span>
										</div>
									</div>
									<!-- Recommendations -->
									<div class="mt-2">
										<span class="text-surface-500-400-token block text-xs mb-1">Recommendations</span>
										<div class="flex gap-1">
											<span
												class="badge preset-tonal-success text-xs flex-1 text-center"
												title="Incoming recommendations"
											>
												↓{formatSubscriberCount(category.incoming)}
											</span>
											<span
												class="badge preset-tonal-warning text-xs flex-1 text-center"
												title="Outgoing recommendations"
											>
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
					<section class="flex flex-col gap-4 p-4 md:gap-6 md:p-6 md:flex-row md:items-center md:justify-between">
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
						<div class="flex flex-1 justify-center md:justify-end overflow-x-auto">
							<Pagination
								data={sortedData}
								page={currentPage}
								onPageChange={(e) => (currentPage = e.page)}
								{pageSize}
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
							Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}-{Math.min(
								currentPage * pageSize,
								sortedData.length
							)} of {sortedData.length} categories
						</div>
					</section>
				{/if}
			</section>
		</main>
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
