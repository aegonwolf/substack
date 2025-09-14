<script lang="ts">
	import type { PageData } from './$types';
	import HeatmapTable from '$lib/components/topic-meta/HeatmapTable.svelte';
	import FeatureBarChart from '$lib/components/topic-meta/FeatureBarChart.svelte';
	import EngagementLineChart from '$lib/components/topic-meta/EngagementLineChart.svelte';
	import ContentLengthChart from '$lib/components/topic-meta/ContentLengthChart.svelte';
	import FeatureCombinationChart from '$lib/components/topic-meta/FeatureCombinationChart.svelte';
	import SamplePostsCard from '$lib/components/topic-meta/SamplePostsCard.svelte';
	import { ArrowUp, ArrowDown, TrendingUp, FileText, MessageSquare, Share2 } from '@lucide/svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Loading and error states
	const isLoading = $derived(!data || !data.metaData);
	const hasError = $derived(data?.error);

	// Extract feature data for charts
	const featureData = $derived.by(() => {
		if (!data?.metaData) return [];

		return Object.entries(data.metaData)
			.filter(([key]) => key.startsWith('topics_'))
			.map(([key, value]: [string, any]) => ({
				key,
				...value
			}))
			.sort((a, b) => Math.abs(b.effect_percentage) - Math.abs(a.effect_percentage));
	});

	// Get basic statistics
	const basicStats = $derived(data?.metaData?.basic_statistics);

	// Selected metric for bar charts
	let selectedMetric = $state<
		'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks'
	>('mean_engagement');

	// Toggle for normalized metrics (per 1000 subscribers)
	let useNormalizedMetrics = $state(false);

	// Sample posts category selection
	let selectedSampleCategory = $state<string>('top_viral');

	// Format large numbers
	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}k`;
		}
		return num.toFixed(0);
	}
</script>

<!-- Main Dashboard Layout -->
<div class="container mx-auto max-w-7xl space-y-6 px-4 py-4 md:space-y-8 md:px-6">
	<!-- Header Section -->
	<header class="space-y-4 px-2 text-center">
		<h1 class="gradient-heading h1 leading-tight">Substack Engagement Analysis</h1>
		<p class="text-surface-600-300-token">
			Engagement patterns and feature impact analysis from 50k Substack posts
		</p>
	</header>

	{#if isLoading}
		<!-- Loading State -->
		<div
			class="flex flex-col items-center justify-center space-y-6 py-16"
			role="status"
			aria-live="polite"
		>
			<div class="bg-surface-300-600-token placeholder-circle h-20 w-20 animate-pulse"></div>
			<div class="space-y-2 text-center">
				<p class="text-surface-700-200-token text-lg font-medium">Loading analysis data...</p>
				<p class="text-surface-500-400-token text-sm">Please wait while we fetch the meta data</p>
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
			<p class="text-error-100">{data?.error || 'Unable to load meta data files'}</p>
		</div>
	{:else}
		<!-- Summary Cards -->
		{#if basicStats}
			<section class="grid grid-cols-1 gap-4 md:grid-cols-4">
				{#each basicStats.basic_statistics as stat}
					<div class="card preset-tonal-surface p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-surface-600-300-token text-xs tracking-wide uppercase">
									{stat.metric.replace(/_/g, ' ')}
								</p>
								<p class="mt-1 text-2xl font-bold">
									{formatNumber(stat.mean)}
								</p>
								<p class="text-surface-500-400-token mt-1 text-xs">avg per post</p>
							</div>
							<div class="text-3xl opacity-20">
								{#if stat.metric === 'reaction_count'}
									<TrendingUp />
								{:else if stat.metric === 'comment_count'}
									<MessageSquare />
								{:else if stat.metric === 'restacks'}
									<Share2 />
								{:else}
									<FileText />
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		<!-- Main Heatmap Table (Full Width) -->
		<section class="w-full">
			{#if data?.metaData}
				<HeatmapTable data={data.metaData} />
			{/if}
		</section>

		<!-- Metric Selector -->
		<section class="card preset-tonal-surface p-4">
			<div class="flex flex-col items-start gap-4 md:flex-row md:items-center">
				<div class="flex items-center gap-4">
					<label for="metric-select" class="font-medium">Select Metric:</label>
					<select
						id="metric-select"
						class="select preset-outlined-surface-200-800"
						bind:value={selectedMetric}
					>
						<option value="mean_engagement">Engagement Score</option>
						<option value="mean_reactions">Reactions</option>
						<option value="mean_comments">Comments</option>
						<option value="mean_restacks">Restacks</option>
					</select>
				</div>

				<div class="flex items-center gap-3">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" bind:checked={useNormalizedMetrics} class="checkbox" />
						<span class="text-sm font-medium"> Normalize per 1,000 subscribers </span>
					</label>
					<span class="badge preset-tonal-primary text-xs">
						{useNormalizedMetrics ? 'Relative' : 'Absolute'}
					</span>
				</div>
			</div>
		</section>

		<!-- Bar Charts Grid -->
		<section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each featureData.slice(0, 6) as feature}
				<FeatureBarChart
					data={feature}
					title={feature.key.replace('topics_', '').replace(/_/g, ' ')}
					metric={selectedMetric}
					useNormalized={useNormalizedMetrics}
				/>
			{/each}
		</section>

		<!-- Feature Interactions Section -->
		<section class="space-y-6">
			<h2 class="h2">Feature Interactions</h2>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Feature Combination Charts -->
				{#if data?.metaData?.combination_has_images_has_question}
					<div class="card preset-tonal-surface">
						<div class="card-header">
							<h3 class="h4">Images × Questions Analysis</h3>
							<p class="text-surface-600-300-token text-sm">
								How combining images and questions affects engagement
							</p>
						</div>
						<div class="p-4">
							<FeatureCombinationChart
								data={data.metaData.combination_has_images_has_question}
								metric={selectedMetric}
								height={300}
							/>
						</div>
					</div>
				{/if}

				{#if data?.metaData?.combination_has_images_has_lists}
					<div class="card preset-tonal-surface">
						<div class="card-header">
							<h3 class="h4">Images × Lists Analysis</h3>
							<p class="text-surface-600-300-token text-sm">
								Impact of combining images with bullet/numbered lists
							</p>
						</div>
						<div class="p-4">
							<FeatureCombinationChart
								data={data.metaData.combination_has_images_has_lists}
								metric={selectedMetric}
								height={300}
							/>
						</div>
					</div>
				{/if}

				{#if data?.metaData?.combination_has_number_has_question}
					<div class="card preset-tonal-surface">
						<div class="card-header">
							<h3 class="h4">Numbers × Questions Analysis</h3>
							<p class="text-surface-600-300-token text-sm">
								Effect of combining numbers in titles with questions
							</p>
						</div>
						<div class="p-4">
							<FeatureCombinationChart
								data={data.metaData.combination_has_number_has_question}
								metric={selectedMetric}
								height={300}
							/>
						</div>
					</div>
				{/if}

				{#if data?.metaData?.combination_is_weekend_has_images}
					<div class="card preset-tonal-surface">
						<div class="card-header">
							<h3 class="h4">Weekend × Images Analysis</h3>
							<p class="text-surface-600-300-token text-sm">
								How weekend posting combined with images affects reach
							</p>
						</div>
						<div class="p-4">
							<FeatureCombinationChart
								data={data.metaData.combination_is_weekend_has_images}
								metric={selectedMetric}
								height={300}
							/>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<!-- Sample Posts Section -->
		{#if data?.metaData?.sample_posts}
			<section class="space-y-6">
				<h2 class="h2">High-Performing Content Examples</h2>

				<!-- Category Selector -->
				<div class="card preset-tonal-surface p-4">
					<div class="flex flex-wrap items-center gap-3">
						<label class="font-medium">View Sample Posts By:</label>
						<div class="flex flex-wrap gap-2">
							{#each Object.keys(data.metaData.sample_posts).filter((k) => k !== 'metadata') as category}
								<button
									class="btn btn-sm transition-all duration-200 {selectedSampleCategory === category
										? 'preset-filled-primary-500'
										: 'preset-tonal-surface hover:preset-filled-surface-300-700'}"
									onclick={() => (selectedSampleCategory = category)}
								>
									{category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
									<span class="ml-2 badge preset-tonal-primary text-xs">
										{data.metaData.sample_posts[category].length}
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Sample Posts with real links -->
					<div class="lg:col-span-1">
						{#if data.metaData.sample_posts[selectedSampleCategory]}
							<SamplePostsCard
								data={{
									top_viral_posts: data.metaData.sample_posts[selectedSampleCategory],
									viral_count: data.metaData.sample_posts[selectedSampleCategory].length,
									viral_percentage: 100,
									threshold_score: 0
								}}
								limit={5}
								title={selectedSampleCategory
									.replace(/_/g, ' ')
									.replace(/\b\w/g, (l) => l.toUpperCase())}
							/>
						{/if}
					</div>

					<!-- Performance Insights -->
					<div class="space-y-4">
						<!-- Viral Threshold Card -->
						<div class="card preset-tonal-surface p-6">
							<h3 class="mb-4 h4">Viral Performance Metrics</h3>
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<span class="text-surface-600-300-token">Viral Threshold:</span>
									<span class="text-primary-600-300-token text-2xl font-bold">
										{data.metaData.viral_posts_analysis.threshold_score.toFixed(0)}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-surface-600-300-token">Viral Posts:</span>
									<span class="font-semibold">
										{data.metaData.viral_posts_analysis.viral_count.toLocaleString()}
										<span class="text-surface-500-400-token text-sm">
											({data.metaData.viral_posts_analysis.viral_percentage.toFixed(2)}%)
										</span>
									</span>
								</div>
							</div>
						</div>

						<!-- Content Patterns Card -->
						<div class="card preset-tonal-surface p-6">
							<h3 class="mb-4 h4">Viral Content Patterns</h3>
							<div class="space-y-3 text-sm">
								{#each data.metaData.viral_posts_analysis.feature_comparison.slice(0, 4) as feature}
									<div class="flex items-center justify-between">
										<span class="text-surface-600-300-token capitalize">
											{feature.feature.replace(/_/g, ' ')}:
										</span>
										<span
											class="font-mono font-semibold {feature.difference_percentage > 0
												? 'text-sky-500'
												: 'text-slate-500'}"
										>
											{feature.difference_percentage > 0
												? '+'
												: ''}{feature.difference_percentage.toFixed(1)}%
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- Temporal Patterns Section -->
		{#if data?.metaData?.temporal_hourly}
			<section class="space-y-6">
				<h2 class="h2">Temporal Patterns</h2>

				<!-- Line Charts -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Hourly Engagement Chart -->
					<div class="card preset-tonal-surface">
						<div class="card-header">
							<h3 class="h4">Engagement by Hour of Day</h3>
							<p class="text-surface-600-300-token text-sm">
								Peak at {data.metaData.temporal_hourly.best_hour}:00, Low at {data.metaData
									.temporal_hourly.worst_hour}:00
							</p>
						</div>
						<div class="p-4">
							<EngagementLineChart
								data={data.metaData.temporal_hourly}
								chartType="hourly"
								metric={selectedMetric}
								height={350}
							/>
						</div>
					</div>

					<!-- Yearly Trend Chart -->
					{#if data?.metaData?.temporal_yearly}
						<div class="card preset-tonal-surface">
							<div class="card-header">
								<h3 class="h4">Engagement Trend by Year</h3>
								<p class="text-surface-600-300-token text-sm">Long-term engagement evolution</p>
							</div>
							<div class="p-4">
								<EngagementLineChart
									data={data.metaData.temporal_yearly}
									chartType="yearly"
									metric={selectedMetric}
									height={350}
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Summary Cards -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Best/Worst Times Card -->
					<div class="card preset-tonal-surface p-6">
						<h3 class="mb-4 h4">Optimal Posting Times</h3>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-surface-600-300-token">Best Hour:</span>
								<span class="px-3 py-1 rounded-full text-white font-bold text-sm" style="background-color: #0ea5e9;">
									{data.metaData.temporal_hourly.best_hour}:00
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-surface-600-300-token">Worst Hour:</span>
								<span class="px-3 py-1 rounded-full text-white font-bold text-sm" style="background-color: #64748b;">
									{data.metaData.temporal_hourly.worst_hour}:00
								</span>
							</div>
						</div>
					</div>

					<!-- Top Viral Characteristics -->
					{#if data?.metaData?.viral_posts_analysis}
						<div class="card preset-tonal-surface p-6">
							<h3 class="mb-4 h4">Viral Post Characteristics</h3>
							<div class="space-y-2 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-surface-600-300-token">Threshold Score:</span>
									<span class="font-mono font-bold">
										{data.metaData.viral_posts_analysis.threshold_score.toFixed(0)}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-surface-600-300-token">Viral Posts:</span>
									<span class="font-mono">
										{data.metaData.viral_posts_analysis.viral_count} ({data.metaData.viral_posts_analysis.viral_percentage.toFixed(
											1
										)}%)
									</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Content Length Analysis Section -->
		{#if data?.metaData && 'content_length_analysis' in data.metaData && data.metaData.content_length_analysis}
			<section class="space-y-4">
				<h2 class="h2">Content Length Analysis</h2>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<!-- Content Length Chart - Takes 2 columns -->
					<div class="lg:col-span-2">
						<div class="card preset-tonal-surface">
							<div class="card-header">
								<h3 class="h4">Engagement by Content Length</h3>
								<p class="text-surface-600-300-token text-sm">
									How article length affects engagement metrics
								</p>
							</div>
							<div class="p-4">
								<ContentLengthChart
									data={data.metaData.content_length_analysis}
									metric={selectedMetric}
									height={400}
								/>
							</div>
						</div>
					</div>

					<!-- Length Insights Card - Takes 1 column -->
					<div class="space-y-4">
						<!-- Top Performing Length -->
						<div class="card preset-tonal-surface p-6">
							<h3 class="mb-4 h4">Length Insights</h3>
							<div class="space-y-3 text-sm">
								{#each data.metaData.content_length_analysis.data?.slice(0, 3) || [] as lengthBin, index}
									<div class="flex items-center justify-between">
										<span class="text-surface-600-300-token">{lengthBin.length_bin}:</span>
										<div class="text-right">
											<div class="font-mono font-semibold">
												{lengthBin.mean_engagement.toFixed(0)}
											</div>
											<div class="text-surface-500-400-token text-xs">
												{lengthBin.count.toLocaleString()} posts
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Length Distribution -->
						<div class="card preset-tonal-surface p-6">
							<h3 class="mb-3 h5">Distribution</h3>
							<div class="space-y-2">
								{#each data.metaData.content_length_analysis.data || [] as lengthBin}
									<div class="flex items-center gap-2">
										<span class="text-surface-600-300-token w-12 text-xs"
											>{lengthBin.length_bin}</span
										>
										<div class="bg-surface-200-700-token h-2 flex-1 rounded-full">
											<div
												class="h-2 rounded-full bg-primary-500 transition-all duration-500"
												style="width: {lengthBin.percentage}%"
											></div>
										</div>
										<span class="w-10 text-right text-xs">{lengthBin.percentage.toFixed(1)}%</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	/* Custom gradient heading (reused from main page) */
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

	.placeholder-circle {
		animation: pulse-glow 2s ease-in-out infinite;
	}

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
</style>
