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
			mean_engagement_per_1k: number;
			mean_reactions_per_1k: number;
			mean_comments_per_1k: number;
			mean_restacks_per_1k: number;
		};
		without_feature: {
			count: number;
			percentage: number;
			mean_engagement: number;
			mean_reactions: number;
			mean_comments: number;
			mean_restacks: number;
			mean_engagement_per_1k: number;
			mean_reactions_per_1k: number;
			mean_comments_per_1k: number;
			mean_restacks_per_1k: number;
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

	// Define metrics configuration
	const metrics = [
		{ key: 'mean_engagement', label: 'Engagement', format: formatNumber },
		{ key: 'mean_comments', label: 'Comments', format: (n: number) => n.toFixed(1) },
		{ key: 'mean_restacks', label: 'Restacks', format: (n: number) => n.toFixed(1) }
	];

	// Color scale for heatmap - create it directly in the function
	function getHeatmapColor(value: number): string {
		const colorScale = d3.scaleSequential().domain([-100, 100]).interpolator(d3.interpolateRdYlBu);
		return colorScale(-value);
	}

	function formatNumber(num: number): string {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}k`;
		}
		return num.toFixed(0);
	}

$inspect("Heatmap Data", data)
</script>

<div class="w-full">
	<div class="card shadow-xl">
		<header class="card-header">
			<h3 class="h3">Feature Impact Heatmap</h3>
			<p class="text-surface-600-300-token mt-1 text-sm">
				Impact of content features on engagement metrics
			</p>
		</header>

		<div class="overflow-x-auto p-4">
			<table class="table-hover table">
				<thead>
					<!-- Parent Headers -->
					<tr class="preset-tonal-surface">
						<th rowspan="2" class="text-left border-r">Feature</th>
						<th rowspan="2" class="text-center border-r">Effect %</th>
						{#each metrics as metric, i}
							<th colspan="2" class="text-center {i === metrics.length - 1 ? '' : 'border-r'}">{metric.label}</th>
						{/each}
						<th rowspan="2" class="text-center">Posts</th>
					</tr>
					<!-- Sub Headers -->
					<tr class="preset-tonal-surface">
						{#each metrics as metric, i}
							<th class="text-center text-xs">With<br/>(per 1k)</th>
							<th class="text-center text-xs {i === metrics.length - 1 ? '' : 'border-r'}">Without<br/>(per 1k)</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each tableData as row}
						<tr
							class="transition-all duration-200 hover:preset-tonal-primary {row
								.statistical_significance?.significant
								? 'border-l-2 border-primary-500'
								: ''}"
						>
							<td class="font-medium capitalize border-r">
								{row.feature}
							</td>
							<td class="text-center border-r">
								<span
									class="badge px-3 py-1 font-bold text-surface-800"
									style="background-color: {getHeatmapColor(row.effect_percentage)}"
								>
									{row.effect_percentage > 0 ? '+' : ''}{row.effect_percentage.toFixed(1)}%
								</span>
							</td>
							{#each metrics as metric, i}
								<!-- With Feature -->
								<td class="text-center font-mono">
									<div>{metric.format(row.with_feature[metric.key])}</div>
									<div class="text-surface-500-400-token text-xs">
										({row.with_feature[`${metric.key}_per_1k`].toFixed(1)})
									</div>
								</td>
								<!-- Without Feature -->
								<td class="text-center font-mono {i === metrics.length - 1 ? '' : 'border-r'}">
									<div>{metric.format(row.without_feature[metric.key])}</div>
									<div class="text-surface-500-400-token text-xs">
										({row.without_feature[`${metric.key}_per_1k`].toFixed(1)})
									</div>
								</td>
							{/each}
							<td class="text-center">
								<span class="badge preset-tonal-surface text-xs">
									{formatNumber(row.with_feature.count)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<footer class="card-footer">
			<div class="flex items-center gap-4 text-xs text-surface-700-300">
				<span>Color scale: Blue (less engagement) → Yellow (neutral) → Red (more engagement)</span>
				<span>Red border = Statistically significant (p &lt; 0.05)</span>
			</div>
		</footer>
	</div>
</div>
