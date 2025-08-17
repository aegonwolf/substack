<script lang="ts">
	import { createBarScale, getSkeletonColor, formatSubscriberCount } from '$lib/utils/statistics';
	import {
		chartState,
		setHoveredCategory,
		setSelectedCategory
	} from '$lib/stores/chartInteractivity.svelte';
	import type { CategoryStatistics } from '../../routes/cats/+page.server';

	interface Props {
		statistics: CategoryStatistics[];
		metric?: 'average' | 'minimum' | 'maximum' | 'standardDeviation';
	}

	let { statistics, metric = 'average' }: Props = $props();

	// Reactive computation for chart data
	let chartData = $derived.by(() => {
		if (!statistics || statistics.length === 0) return [];

		const values = statistics.map((stat) => {
			switch (metric) {
				case 'minimum':
					return stat.minimum;
				case 'maximum':
					return stat.maximum;
				case 'standardDeviation':
					return stat.standardDeviation;
				default:
					return stat.average;
			}
		});

		const scale = createBarScale(values, 100);

		return statistics.map((stat, index) => ({
			category: stat.category,
			value: values[index],
			color: getSkeletonColor(index),
			width: scale(values[index]),
			statistics: stat
		}));
	});

	function handleBarHover(event: MouseEvent, stats: CategoryStatistics | null) {
		setHoveredCategory(stats?.category || null, stats, event);
	}

	function handleTouchStart(event: TouchEvent, stats: CategoryStatistics) {
		// For touch devices, show the sidebar immediately on touch
		const touch = event.touches[0];
		const mockMouseEvent = new MouseEvent('mousemove', {
			clientX: touch.clientX,
			clientY: touch.clientY
		});
		setHoveredCategory(stats.category, stats, mockMouseEvent);
	}

	function handleBarClick(stats: CategoryStatistics) {
		setSelectedCategory(stats.category === chartState.selectedCategory ? null : stats.category);
	}

	function handleKeyNavigation(event: KeyboardEvent, currentIndex: number) {
		const bars = chartData;
		if (!bars.length) return;

		let nextIndex = currentIndex;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				nextIndex = Math.min(currentIndex + 1, bars.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				nextIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'Home':
				event.preventDefault();
				nextIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				nextIndex = bars.length - 1;
				break;
			default:
				return;
		}

		// Focus the next bar
		const nextBar = document.querySelector(`[data-bar-index="${nextIndex}"]`) as HTMLElement;
		if (nextBar) {
			nextBar.focus();
			// Show hover state for keyboard navigation
			setHoveredCategory(bars[nextIndex].category, bars[nextIndex].statistics);
		}
	}
</script>

<div class="category-bar-chart w-full">
	{#if chartData.length === 0}
		<div class="flex h-32 items-center justify-center text-surface-500">
			<p>No data available</p>
		</div>
	{:else}
		<div class="space-y-3" role="group" aria-label="Category statistics chart">
			{#each chartData as item, index}
				<div class="bar-row flex items-center gap-4">
					<!-- Category label -->
					<div class="category-label w-24 flex-shrink-0 text-right text-sm font-medium">
						{item.category.charAt(0).toUpperCase() + item.category.slice(1)}
					</div>

					<!-- Bar container -->
					<div class="bar-container relative flex-1">
						<div
							class="bar-track relative h-8 overflow-hidden rounded-md bg-surface-200 dark:bg-surface-800"
						>
							<!-- Animated bar -->
							<div
								class="h-full cursor-pointer rounded-md transition-all duration-300 ease-out hover:scale-105 hover:opacity-80 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none {item.color}"
								class:ring-2={chartState.selectedCategory === item.category}
								class:ring-primary-400={chartState.selectedCategory === item.category}
								class:ring-offset-2={chartState.selectedCategory === item.category}
								class:opacity-50={chartState.selectedCategory &&
									chartState.selectedCategory !== item.category}
								style="width: {item.width}%"
								role="button"
								tabindex="0"
								data-bar-index={index}
								aria-label="Category {item.category}: {formatSubscriberCount(
									item.value
								)} {metric}. Use arrow keys to navigate, Enter or Space to select."
								aria-pressed={chartState.selectedCategory === item.category}
								aria-describedby="chart-instructions"
								onmouseenter={(e) => handleBarHover(e, item.statistics)}
								onmouseleave={(e) => handleBarHover(e, null)}
								onmousemove={(e) => handleBarHover(e, item.statistics)}
								ontouchstart={(e) => handleTouchStart(e, item.statistics)}
								onclick={() => handleBarClick(item.statistics)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleBarClick(item.statistics);
									} else {
										handleKeyNavigation(e, index);
									}
								}}
							></div>
						</div>
					</div>

					<!-- Value label -->
					<div
						class="value-label w-20 flex-shrink-0 text-sm text-surface-600 dark:text-surface-400"
					>
						{formatSubscriberCount(item.value)}
					</div>
				</div>
			{/each}
		</div>

		<!-- Screen reader instructions -->
		<div id="chart-instructions" class="sr-only">
			Use arrow keys to navigate between categories, Enter or Space to select a category, Home and
			End to jump to first or last category.
		</div>
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		.category-label {
			width: 4rem;
			font-size: 0.75rem;
		}

		.value-label {
			width: 4rem;
			font-size: 0.75rem;
		}

		.bar-track {
			height: 1.5rem;
		}
	}
</style>
