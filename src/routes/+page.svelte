<script lang="ts">
	import type { PageData } from './$types';
	import type { FilterState } from '$lib/types';
	import { formatSubscriberCount } from '$lib/utils';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	// Icons for pagination
	import { ArrowLeft, ArrowRight, Ellipsis, ChevronsLeft, ChevronsRight } from '@lucide/svelte';

	// Props using Svelte 5 runes syntax
	const { data }: { data: PageData } = $props();

	// Reactive state management with Svelte 5 runes
	let selectedCategory = $state<string>('All Categories');
	let selectedBoard = $state<FilterState['board'] | 'all'>('all');

	// Pagination state
	let currentPage = $state(1);
	let pageSize = $state(25);

	// Extract unique categories from the data for filter options
	const categories = $derived.by(() => {
		if (!data?.publications) return ['All Categories'];
		const uniqueCategories = [...new Set(data.publications.map((pub) => pub.leaderboard_category))];
		return ['All Categories', ...uniqueCategories.sort()];
	});

	// Computed filtered data based on current filter selections
	const filteredData = $derived.by(() => {
		if (!data?.publications) {
			return [];
		}

		// Filter by payment type: all, free (payments_enabled !== true) or paid (payments_enabled === true)
		let filtered = data.publications;
		if (selectedBoard === 'free') {
			filtered = data.publications.filter((pub) => pub.payments_enabled !== true);
		} else if (selectedBoard === 'paid') {
			filtered = data.publications.filter((pub) => pub.payments_enabled === true);
		}
		// If selectedBoard === 'all', no filtering is applied

		if (selectedCategory !== 'All Categories') {
			filtered = filtered.filter((pub) => pub.leaderboard_category === selectedCategory);
		}

		// Maintain subscriber count ordering (descending)
		const sorted = filtered.sort((a, b) => b.subscriber_count - a.subscriber_count);
		return sorted;
	});

	// Paginated data derived from filtered data
	const paginatedData = $derived.by(() => {
		const startIndex = (currentPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		return filteredData.slice(startIndex, endIndex);
	});

	// Reset to first page when filters change
	$effect(() => {
		selectedCategory;
		selectedBoard;
		currentPage = 1;
	});

	// Loading and error states
	const isLoading = $derived(!data);
	const hasError = $derived(data && !data.publications);


	// Accessibility: Handle keyboard navigation for filter controls
	function handleCategoryKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			(event.target as HTMLSelectElement).click();
		}
	}

	function handleBoardKeydown(event: KeyboardEvent, boardType: FilterState['board'] | 'all') {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectedBoard = boardType;
		}
	}
</script>

<!-- Main Dashboard Layout -->
<div class="container mx-auto max-w-7xl space-y-6 px-4 py-4 md:space-y-8 md:px-6">
	<!-- Header Section -->
	<header class="space-y-4 text-center px-2">
		<h1 class="gradient-heading h1 leading-tight">Substack Subscriber Ranking</h1>
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
				<p class="text-surface-700-200-token text-lg font-medium">Loading publication data...</p>
				<p class="text-surface-500-400-token text-sm">
					Please wait while we fetch the latest rankings
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
				Unable to load publication data. Please check your connection and try refreshing the page.
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
			<!-- Filter Controls Section -->
			<section class="card preset-tonal-surface p-4 md:p-6 shadow-lg" aria-labelledby="filter-heading">
				<h2 id="filter-heading" class="text-surface-900-50-token mb-4 md:mb-6 h3">Filter Publications</h2>
				<div class="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
					<!-- Category Filter -->
					<div class="space-y-3">
						<label class="text-surface-800-100-token label font-medium" for="category-select">
							Category
							<span class="text-surface-500-400-token ml-1 text-sm"
								>({categories.length - 1} available)</span
							>
						</label>
						<select
							id="category-select"
							class="select preset-outlined-surface-200-800 transition-all duration-200 focus:preset-outlined-primary-200-800 focus:ring-2 focus:ring-primary-500/20"
							bind:value={selectedCategory}
							onkeydown={handleCategoryKeydown}
							aria-describedby="category-help"
						>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
						<p id="category-help" class="text-surface-500-400-token text-xs">
							Filter publications by content category
						</p>
					</div>

					<!-- Board Type Filter -->
					<div class="space-y-3">
						<span class="text-surface-800-100-token label font-medium">
							Subscription Type
						</span>
						<div class="space-y-2 md:space-y-0">
							<!-- Mobile: Stacked buttons -->
							<div class="flex flex-col gap-2 md:hidden">
								<button
									class="btn w-full justify-center py-3 transition-all duration-200 {selectedBoard === 'all'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'all')}
									onkeydown={(e) => handleBoardKeydown(e, 'all')}
									role="radio"
									aria-checked={selectedBoard === 'all'}
									aria-label="Show all publications"
								>
									All Publications
								</button>
								<button
									class="btn w-full justify-center py-3 transition-all duration-200 {selectedBoard === 'free'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'free')}
									onkeydown={(e) => handleBoardKeydown(e, 'free')}
									role="radio"
									aria-checked={selectedBoard === 'free'}
									aria-label="Show free publications"
								>
									Free Publications
								</button>
								<button
									class="btn w-full justify-center py-3 transition-all duration-200 {selectedBoard === 'paid'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'paid')}
									onkeydown={(e) => handleBoardKeydown(e, 'paid')}
									role="radio"
									aria-checked={selectedBoard === 'paid'}
									aria-label="Show paid publications"
								>
									Paid Publications
								</button>
							</div>
							<!-- Desktop: Button group -->
							<div
								class="hidden md:flex btn-group preset-filled-surface-200-800"
								role="radiogroup"
								aria-labelledby="board-type-label"
							>
								<button
									class="btn transition-all duration-200 {selectedBoard === 'all'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'all')}
									onkeydown={(e) => handleBoardKeydown(e, 'all')}
									role="radio"
									aria-checked={selectedBoard === 'all'}
									aria-label="Show all publications"
								>
									All Publications
								</button>
								<button
									class="btn transition-all duration-200 {selectedBoard === 'free'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'free')}
									onkeydown={(e) => handleBoardKeydown(e, 'free')}
									role="radio"
									aria-checked={selectedBoard === 'free'}
									aria-label="Show free publications"
								>
									Free Publications
								</button>
								<button
									class="btn transition-all duration-200 {selectedBoard === 'paid'
										? 'preset-filled-primary-500 shadow-md'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedBoard = 'paid')}
									onkeydown={(e) => handleBoardKeydown(e, 'paid')}
									role="radio"
									aria-checked={selectedBoard === 'paid'}
									aria-label="Show paid publications"
								>
									Paid Publications
								</button>
							</div>
						</div>
						<p class="text-surface-500-400-token text-xs">
							Filter by subscription model or view all publications
						</p>
					</div>
				</div>
			</section>

			<!-- Leaderboard Table Section -->
			<section class="card shadow-xl" aria-labelledby="rankings-heading">

				{#if filteredData.length === 0}
					<!-- No Results State -->
					<div class="space-y-4 p-12 text-center" role="status" aria-live="polite">
						<div class="text-6xl opacity-50">📊</div>
						<h3 class="text-surface-700-200-token h4">No Publications Found</h3>
						<p class="text-surface-500-400-token mx-auto max-w-md">
							No publications match your current filter selection. Try adjusting your category or
							board type filters.
						</p>
						<button
							class="hover:preset-filled-primary-600 btn preset-filled-primary-500 transition-all duration-200"
							onclick={() => {
								selectedCategory = 'All Categories';
								selectedBoard = 'all';
							}}
							aria-label="Reset filters to show all publications"
						>
							Reset Filters
						</button>
					</div>
				{:else}
					<!-- Desktop Table -->
					<div class="hidden p-4 md:p-6 md:block">
						<div class="table-container">
							<table class="table-hover table" aria-label="Publication leaderboard rankings">
								<thead>
									<tr class="preset-tonal-surface">
										<th class="text-surface-800-100-token text-left font-semibold" scope="col">
											<span class="flex items-center gap-2"> Rank </span>
										</th>
										<th class="text-surface-800-100-token text-left font-semibold" scope="col">
											<span class="flex items-center gap-2"> Publication </span>
										</th>
										<th class="text-surface-800-100-token text-left font-semibold" scope="col">
											<span class="flex items-center gap-2"> Category </span>
										</th>
										<th class="text-surface-800-100-token text-center font-semibold" scope="col">
											<span class="flex items-center justify-center gap-2"> Recommendations </span>
										</th>
										<th class="text-surface-800-100-token text-right font-semibold" scope="col">
											<span class="flex items-center justify-end gap-2"> Subscribers </span>
										</th>
									</tr>
								</thead>
								<tbody>
									{#each paginatedData as publication, index}
										<tr class="group transition-all duration-200 hover:preset-tonal-primary">
											<td class="text-lg font-bold">
												<span class="flex items-center gap-2">
													#{(currentPage - 1) * pageSize + index + 1}
												</span>
											</td>
											<td>
												<a
													href={publication.publication_url}
													target="_blank"
													rel="noopener noreferrer"
													class="text-primary-600-300-token hover:text-primary-500-400-token anchor font-medium transition-all duration-200 group-hover:underline focus:rounded focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
													aria-label="Visit {publication.name} on Substack"
												>
													{publication.name}
												</a>
											</td>
											<td class="text-surface-600-300-token capitalize">
												<span class="badge preset-tonal-secondary text-xs">
													{publication.leaderboard_category}
												</span>
											</td>
											<td class="text-surface-600-300-token text-center font-mono">
												<div class="flex gap-1 justify-center">
													<span class="badge preset-tonal-success text-xs" title="Incoming recommendations">
														↓{publication.incoming_recommendations || 0}
													</span>
													<span class="badge preset-tonal-warning text-xs" title="Outgoing recommendations">
														↑{publication.outgoing_recommendations || 0}
													</span>
												</div>
											</td>
											<td class="text-surface-800-100-token text-right font-mono font-semibold">
												{formatSubscriberCount(publication.subscriber_count)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Mobile Card Layout -->
					<div class="space-y-3 p-4 md:hidden">
						{#each paginatedData as publication, index}
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

								<a
									href={publication.publication_url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary-600-300-token hover:text-primary-500-400-token mb-3 block anchor text-lg font-bold transition-all duration-200 focus:rounded focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
									aria-label="Visit {publication.name} on Substack"
								>
									{publication.name}
								</a>

								<div class="flex items-center justify-between">
									<div class="flex flex-col gap-1">
										<span class="badge preset-tonal-tertiary text-xs capitalize">
											{publication.leaderboard_category}
										</span>
										<div class="flex gap-1">
											<span class="badge preset-tonal-success text-xs" title="Incoming recommendations">
												↓{publication.incoming_recommendations || 0}
											</span>
											<span class="badge preset-tonal-warning text-xs" title="Outgoing recommendations">
												↑{publication.outgoing_recommendations || 0}
											</span>
										</div>
									</div>
									<p class="text-surface-700-200-token font-mono text-sm font-semibold">
										{formatSubscriberCount(publication.subscriber_count)} subscribers
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Pagination Controls -->
				{#if filteredData.length > 0}
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
								<option value={100}>100</option>
							</select>
						</div>

						<!-- Pagination Component -->
						<div class="flex-1 flex justify-center md:justify-end overflow-x-auto">
							<Pagination
								data={filteredData}
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
							Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} publications
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

	/* Ensure proper contrast for links */
	.anchor:focus {
		background-color: var(--color-primary-500);
		color: var(--color-primary-contrast-500);
		padding: 2px 4px;
		border-radius: 4px;
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
