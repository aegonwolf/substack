<script lang="ts">
    import type { PageData } from './$types';
    import HeatmapTable from '$lib/components/topic-meta/HeatmapTable.svelte';
    import FeatureBarChart from '$lib/components/topic-meta/FeatureBarChart.svelte';
    import EngagementLineChart from '$lib/components/topic-meta/EngagementLineChart.svelte';
    import ContentLengthChart from '$lib/components/topic-meta/ContentLengthChart.svelte';
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
    let selectedMetric = $state<'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks'>('mean_engagement');

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
    <header class="space-y-4 text-center px-2">
        <h1 class="gradient-heading h1 leading-tight">Topic Meta Analysis Dashboard</h1>
        <p class="text-surface-600-300-token">
            Engagement patterns and feature impact analysis from {data?.indexData?.meta?.total_posts ? formatNumber(data.indexData.meta.total_posts) : '36k'} Substack posts
        </p>
    </header>

    {#if isLoading}
        <!-- Loading State -->
        <div class="flex flex-col items-center justify-center space-y-6 py-16" role="status" aria-live="polite">
            <div class="bg-surface-300-600-token placeholder-circle h-20 w-20 animate-pulse"></div>
            <div class="space-y-2 text-center">
                <p class="text-surface-700-200-token text-lg font-medium">Loading analysis data...</p>
                <p class="text-surface-500-400-token text-sm">Please wait while we fetch the meta data</p>
            </div>
        </div>
    {:else if hasError}
        <!-- Error State -->
        <div class="space-y-4 card preset-filled-error-500 p-8 text-center" role="alert" aria-live="assertive">
            <div class="text-6xl">⚠️</div>
            <h2 class="h3 text-white">Error Loading Data</h2>
            <p class="text-error-100">{data?.error || 'Unable to load meta data files'}</p>
        </div>
    {:else}
        <!-- Summary Cards -->
        {#if basicStats}
            <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
                {#each basicStats.basic_statistics as stat}
                    <div class="card preset-tonal-surface p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs text-surface-600-300-token uppercase tracking-wide">
                                    {stat.metric.replace(/_/g, ' ')}
                                </p>
                                <p class="text-2xl font-bold mt-1">
                                    {formatNumber(stat.mean)}
                                </p>
                                <p class="text-xs text-surface-500-400-token mt-1">
                                    avg per post
                                </p>
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
            <div class="flex items-center gap-4">
                <label for="metric-select" class="font-medium">Select Metric for Charts:</label>
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
        </section>

        <!-- Bar Charts Grid -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each featureData.slice(0, 6) as feature}
                <FeatureBarChart
                    data={feature}
                    title={feature.key.replace('topics_', '').replace(/_/g, ' ')}
                    metric={selectedMetric}
                />
            {/each}
        </section>

        <!-- Temporal Patterns Section -->
        {#if data?.metaData?.temporal_hourly}
            <section class="space-y-6">
                <h2 class="h2">Temporal Patterns</h2>

                <!-- Line Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Hourly Engagement Chart -->
                    <div class="card preset-tonal-surface">
                        <div class="card-header">
                            <h3 class="h4">Engagement by Hour of Day</h3>
                            <p class="text-sm text-surface-600-300-token">
                                Peak at {data.metaData.temporal_hourly.best_hour}:00, Low at {data.metaData.temporal_hourly.worst_hour}:00
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
                                <p class="text-sm text-surface-600-300-token">
                                    Long-term engagement evolution
                                </p>
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Best/Worst Times Card -->
                    <div class="card preset-tonal-surface p-6">
                        <h3 class="h4 mb-4">Optimal Posting Times</h3>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-surface-600-300-token">Best Hour:</span>
                                <span class="badge preset-filled-success-500 font-bold">
                                    {data.metaData.temporal_hourly.best_hour}:00
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-surface-600-300-token">Worst Hour:</span>
                                <span class="badge preset-filled-error-500 font-bold">
                                    {data.metaData.temporal_hourly.worst_hour}:00
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Top Viral Characteristics -->
                    {#if data?.metaData?.viral_posts_analysis}
                        <div class="card preset-tonal-surface p-6">
                            <h3 class="h4 mb-4">Viral Post Characteristics</h3>
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
                                        {data.metaData.viral_posts_analysis.viral_count} ({data.metaData.viral_posts_analysis.viral_percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </section>
        {/if}

        <!-- Content Length Analysis Section -->
        {#if data?.metaData?.content_length_analysis}
            <section class="space-y-4">
                <h2 class="h2">Content Length Analysis</h2>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Content Length Chart - Takes 2 columns -->
                    <div class="lg:col-span-2">
                        <div class="card preset-tonal-surface">
                            <div class="card-header">
                                <h3 class="h4">Engagement by Content Length</h3>
                                <p class="text-sm text-surface-600-300-token">
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
                            <h3 class="h4 mb-4">Length Insights</h3>
                            <div class="space-y-3 text-sm">
                                {#each data.metaData.content_length_analysis.data.slice(0, 3) as lengthBin, index}
                                    <div class="flex items-center justify-between">
                                        <span class="text-surface-600-300-token">{lengthBin.length_bin}:</span>
                                        <div class="text-right">
                                            <div class="font-mono font-semibold">
                                                {lengthBin.mean_engagement.toFixed(0)}
                                            </div>
                                            <div class="text-xs text-surface-500-400-token">
                                                {lengthBin.count.toLocaleString()} posts
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Length Distribution -->
                        <div class="card preset-tonal-surface p-6">
                            <h3 class="h5 mb-3">Distribution</h3>
                            <div class="space-y-2">
                                {#each data.metaData.content_length_analysis.data as lengthBin}
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs w-12 text-surface-600-300-token">{lengthBin.length_bin}</span>
                                        <div class="flex-1 bg-surface-200-700-token rounded-full h-2">
                                            <div
                                                class="bg-primary-500 h-2 rounded-full transition-all duration-500"
                                                style="width: {lengthBin.percentage}%"
                                            ></div>
                                        </div>
                                        <span class="text-xs w-10 text-right">{lengthBin.percentage.toFixed(1)}%</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        {/if}

        <!-- Footer Info -->
        <footer class="text-center text-sm text-surface-500-400-token py-8">
            <p>Data generated: {data?.indexData?.meta?.generated || 'Unknown'}</p>
            <p>Total posts analyzed: {data?.indexData?.meta?.total_posts?.toLocaleString() || 'Unknown'}</p>
        </footer>
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
        0%, 100% {
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
        0%, 100% {
            opacity: 0.6;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.05);
        }
    }
</style>