<script lang="ts">
	import { formatSubscriberCount } from '$lib/utils/statistics';
	import type { CategoryStatistics } from '../../routes/cats/+page.server';

	interface Props {
		visible: boolean;
		statistics: CategoryStatistics | null;
	}

	let { visible, statistics }: Props = $props();
</script>

<div class="sidebar">
	{#if statistics}
		<div class="card p-4 shadow-lg">
			<header class="card-header pb-3">
				<h3 class="text-primary-700 dark:text-primary-200 h3 font-semibold">{statistics.category.charAt(0).toUpperCase() + statistics.category.slice(1)}</h3>
				<p class="text-sm text-surface-600 dark:text-surface-400">{statistics.count} publications</p>
			</header>

			<section class="card-body space-y-3">
				<div class="stat-row flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Average:</span>
					<span class="text-primary-600 dark:text-primary-300 text-sm font-bold"
						>{formatSubscriberCount(statistics.average)}</span
					>
				</div>

				<div class="stat-row flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Minimum:</span>
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>{formatSubscriberCount(statistics.minimum)}</span
					>
				</div>

				<div class="stat-row flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Maximum:</span>
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>{formatSubscriberCount(statistics.maximum)}</span
					>
				</div>

				<div class="stat-row flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Std. Deviation:</span>
					<span class="text-sm text-surface-600 dark:text-surface-400">{statistics.standardDeviation.toFixed(2)}</span
					>
				</div>
			</section>
		</div>
	{:else}
		<div class="card p-4 shadow-lg">
			<div class="flex h-32 items-center justify-center text-surface-500">
				<p class="text-sm">Hover over a category to see more information</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.sidebar {
		min-height: 200px;
	}

	.stat-row {
		border-bottom: 1px solid rgb(229 231 235);
		padding-bottom: 0.5rem;
	}

	.stat-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	@media (prefers-color-scheme: dark) {
		.stat-row {
			border-bottom-color: rgb(55 65 81);
		}
	}
</style>
