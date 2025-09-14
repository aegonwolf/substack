<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	// Color configuration - consistent with FeatureCombinationChart
	const withFeatureColor = '#0ea5e9'; // sky-500
	const withoutFeatureColor = '#64748b'; // slate-500

	interface ChartData {
		feature: string;
		with_feature: {
			mean_engagement: number;
			mean_reactions: number;
			mean_comments: number;
			mean_restacks: number;
			mean_engagement_per_1k: number;
			mean_reactions_per_1k: number;
			mean_comments_per_1k: number;
			mean_restacks_per_1k: number;
			count: number;
			percentage: number;
		};
		without_feature: {
			mean_engagement: number;
			mean_reactions: number;
			mean_comments: number;
			mean_restacks: number;
			mean_engagement_per_1k: number;
			mean_reactions_per_1k: number;
			mean_comments_per_1k: number;
			mean_restacks_per_1k: number;
			count: number;
			percentage: number;
		};
		effect_percentage: number;
	}

	interface Props {
		data: ChartData;
		title?: string;
		metric?: 'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks';
		useNormalized?: boolean;
	}

	let {
		data,
		title = 'Feature Impact',
		metric = 'mean_engagement',
		useNormalized = false
	}: Props = $props();

	let chartContainer: HTMLDivElement;
	let width = $state(400);
	let height = $state(300);

	// Helper function to select correct metric field based on normalization state
	function getMetricField(baseMetric: string, useNormalized: boolean): string {
		if (useNormalized) {
			return `${baseMetric}_per_1k`;
		}
		return baseMetric;
	}

	// Helper function to get metric value with fallback
	function getMetricValue(featureData: any, baseMetric: string, useNormalized: boolean): number {
		const field = getMetricField(baseMetric, useNormalized);

		// Check if normalized field exists, fallback to absolute if not
		if (useNormalized && !(field in featureData)) {
			console.warn(
				`Normalized field '${field}' not found, falling back to absolute value '${baseMetric}'`
			);
			return featureData[baseMetric] || 0;
		}

		return featureData[field] || 0;
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				width = entry.contentRect.width;
				drawChart();
			}
		});

		if (chartContainer) {
			resizeObserver.observe(chartContainer);
		}

		drawChart();

		return () => {
			resizeObserver.disconnect();
		};
	});

	function drawChart() {
		if (!chartContainer || !data) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const margin = { top: 20, right: 30, bottom: 40, left: 60 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const svg = d3.select(chartContainer).append('svg').attr('width', width).attr('height', height);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Prepare data using normalized or absolute values
		const chartData = [
			{
				category: 'With Feature',
				value: getMetricValue(data.with_feature, metric, useNormalized),
				count: data.with_feature.count,
				percentage: data.with_feature.percentage
			},
			{
				category: 'Without Feature',
				value: getMetricValue(data.without_feature, metric, useNormalized),
				count: data.without_feature.count,
				percentage: data.without_feature.percentage
			}
		];

		// Scales
		const x = d3
			.scaleBand()
			.domain(chartData.map((d) => d.category))
			.range([0, innerWidth])
			.padding(0.3);

		const y = d3
			.scaleLinear()
			.domain([0, (d3.max(chartData, (d) => d.value) as number) * 1.1])
			.nice()
			.range([innerHeight, 0]);

		// Draw bars
		g.selectAll('.bar')
			.data(chartData)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', (d) => x(d.category) as number)
			.attr('y', (d) => y(d.value))
			.attr('width', x.bandwidth())
			.attr('height', (d) => innerHeight - y(d.value))
			.attr('fill', (d, i) => (i === 0 ? withFeatureColor : withoutFeatureColor))
			.attr('rx', 1);

		// Add value labels on bars
		g.selectAll('.label')
			.data(chartData)
			.enter()
			.append('text')
			.attr('class', 'label')
			.attr('x', (d) => (x(d.category) as number) + x.bandwidth() / 2)
			.attr('y', (d) => y(d.value) - 5)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '12px')
			.attr('font-weight', 'bold')
			.text((d) => d.value.toFixed(1));

		// Add count labels
		g.selectAll('.count-label')
			.data(chartData)
			.enter()
			.append('text')
			.attr('class', 'count-label')
			.attr('x', (d) => (x(d.category) as number) + x.bandwidth() / 2)
			.attr('y', innerHeight + 35)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '10px')
			.attr('opacity', 0.7)
			.text((d) => `${d.count.toLocaleString()} (${d.percentage.toFixed(1)}%)`);

		// X axis
		g.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(d3.axisBottom(x).tickSize(0))
			.selectAll('text')
			.attr('fill', 'currentColor');

		// Y axis
		g.append('g')
			.call(d3.axisLeft(y).ticks(5).tickSize(0))
			.selectAll('text')
			.attr('fill', 'currentColor');

		// Y axis label
		svg
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 15)
			.attr('x', -(height / 2))
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '12px')
			.text(getMetricLabel(metric, useNormalized));

		// Style axis lines
		g.selectAll('.domain, .tick line')
			.attr('stroke', 'currentColor')
			.attr('opacity', 0.15)
			.attr('stroke-dasharray', '2,2');
	}

	function getMetricLabel(metric: string, useNormalized: boolean = false): string {
		const labels: Record<string, string> = {
			mean_engagement: 'Avg Engagement',
			mean_reactions: 'Avg Reactions',
			mean_comments: 'Avg Comments',
			mean_restacks: 'Avg Restacks'
		};
		const baseLabel = labels[metric] || metric;
		return useNormalized ? `${baseLabel} per 1k` : baseLabel;
	}

	$effect(() => {
		// Redraw when data, metric, or normalization state changes
		data;
		metric;
		useNormalized;
		drawChart();
	});
</script>

<div class="card preset-tonal-surface">
	<header class="card-header">
		<h4 class="h4 capitalize">{title.replace(/_/g, ' ')}</h4>
		<p class="text-surface-600-300-token mt-1 text-xs">
			Effect: {data.effect_percentage > 0 ? '+' : ''}{data.effect_percentage.toFixed(1)}%
		</p>
	</header>
	<div bind:this={chartContainer} class="p-4" style="height: {height + 40}px">
		<!-- Chart renders here -->
	</div>
</div>
