<script lang="ts">
    import * as d3 from 'd3';

    interface FeatureData {
        feature: string;
        with_feature: {
            count: number;
            percentage: number;
            mean_engagement: number;
            mean_reactions: number;
            mean_comments: number;
            mean_restacks: number;
        };
        without_feature: {
            count: number;
            percentage: number;
            mean_engagement: number;
            mean_reactions: number;
            mean_comments: number;
            mean_restacks: number;
        };
        effect_percentage: number;
        statistical_significance?: {
            significant: boolean;
            p_value: number;
        };
    }

    const { data }: { data: Record<string, FeatureData> } = $props();

    // Convert to array for table
    const tableData = $derived.by(() => {
        return Object.entries(data)
            .filter(([key]) => key.startsWith('topics_'))
            .map(([key, value]) => ({
                ...value,
                feature: key.replace('topics_', '').replace(/_/g, ' ')
            }))
            .sort((a, b) => Math.abs(b.effect_percentage) - Math.abs(a.effect_percentage));
    });

    // Color scale for heatmap - create it directly in the function
    function getHeatmapColor(value: number): string {
        const colorScale = d3.scaleSequential()
            .domain([-100, 100])
            .interpolator(d3.interpolateRdYlGn);
        return colorScale(value);
    }

    function formatNumber(num: number): string {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toFixed(0);
    }
</script>

<div class="w-full">
    <div class="card shadow-xl">
        <header class="card-header">
            <h3 class="h3">Feature Impact Heatmap</h3>
            <p class="text-surface-600-300-token text-sm mt-1">
                Impact of content features on engagement metrics
            </p>
        </header>

        <div class="p-4 overflow-x-auto">
            <table class="table table-hover">
                <thead>
                    <tr class="preset-tonal-surface">
                        <th class="text-left">Feature</th>
                        <th class="text-center">Effect %</th>
                        <th class="text-center">With Feature</th>
                        <th class="text-center">Without Feature</th>
                        <th class="text-center">Engagement</th>
                        <th class="text-center">Comments</th>
                        <th class="text-center">Restacks</th>
                        <th class="text-center">Posts</th>
                        <th class="text-center">Significant</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as row}
                        <tr class="hover:preset-tonal-primary transition-all duration-200">
                            <td class="font-medium capitalize">
                                {row.feature}
                            </td>
                            <td class="text-center">
                                <span
                                    class="badge px-3 py-1 font-bold text-white"
                                    style="background-color: {getHeatmapColor(row.effect_percentage)}"
                                >
                                    {row.effect_percentage > 0 ? '+' : ''}{row.effect_percentage.toFixed(1)}%
                                </span>
                            </td>
                            <td class="text-center">
                                <div class="text-sm">
                                    <div class="font-semibold">{formatNumber(row.with_feature.mean_engagement)}</div>
                                    <div class="text-surface-500-400-token text-xs">
                                        {row.with_feature.percentage.toFixed(1)}%
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                <div class="text-sm">
                                    <div class="font-semibold">{formatNumber(row.without_feature.mean_engagement)}</div>
                                    <div class="text-surface-500-400-token text-xs">
                                        {row.without_feature.percentage.toFixed(1)}%
                                    </div>
                                </div>
                            </td>
                            <td class="text-center font-mono">
                                {formatNumber(row.with_feature.mean_engagement)}
                            </td>
                            <td class="text-center font-mono">
                                {row.with_feature.mean_comments.toFixed(1)}
                            </td>
                            <td class="text-center font-mono">
                                {row.with_feature.mean_restacks.toFixed(1)}
                            </td>
                            <td class="text-center">
                                <span class="badge preset-tonal-surface text-xs">
                                    {formatNumber(row.with_feature.count)}
                                </span>
                            </td>
                            <td class="text-center">
                                {#if row.statistical_significance?.significant}
                                    <span class="badge preset-filled-success-500 text-xs">✓</span>
                                {:else}
                                    <span class="badge preset-tonal-surface text-xs">-</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <footer class="card-footer">
            <div class="flex items-center gap-4 text-xs text-surface-600-300-token">
                <span>Color scale: Red (negative) → Yellow (neutral) → Green (positive)</span>
                <span>✓ = Statistically significant (p &lt; 0.05)</span>
            </div>
        </footer>
    </div>
</div>