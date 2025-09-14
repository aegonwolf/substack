<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    interface ChartData {
        feature: string;
        with_feature: {
            mean_engagement: number;
            mean_reactions: number;
            mean_comments: number;
            mean_restacks: number;
            count: number;
            percentage: number;
        };
        without_feature: {
            mean_engagement: number;
            mean_reactions: number;
            mean_comments: number;
            mean_restacks: number;
            count: number;
            percentage: number;
        };
        effect_percentage: number;
    }

    interface Props {
        data: ChartData;
        title?: string;
        metric?: 'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks';
    }

    let { data, title = 'Feature Impact', metric = 'mean_engagement' }: Props = $props();

    let chartContainer: HTMLDivElement;
    let width = $state(400);
    let height = $state(300);

    onMount(() => {
        const resizeObserver = new ResizeObserver(entries => {
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

        const svg = d3.select(chartContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data
        const chartData = [
            {
                category: 'With Feature',
                value: data.with_feature[metric],
                count: data.with_feature.count,
                percentage: data.with_feature.percentage
            },
            {
                category: 'Without Feature',
                value: data.without_feature[metric],
                count: data.without_feature.count,
                percentage: data.without_feature.percentage
            }
        ];

        // Scales
        const x = d3.scaleBand()
            .domain(chartData.map(d => d.category))
            .range([0, innerWidth])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.value) as number * 1.1])
            .nice()
            .range([innerHeight, 0]);

        // Draw bars
        g.selectAll('.bar')
            .data(chartData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.category) as number)
            .attr('y', d => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', d => innerHeight - y(d.value))
            .attr('fill', (d, i) => i === 0 ? '#10b981' : '#6b7280')
            .attr('rx', 4);

        // Add value labels on bars
        g.selectAll('.label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'label')
            .attr('x', d => (x(d.category) as number) + x.bandwidth() / 2)
            .attr('y', d => y(d.value) - 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'currentColor')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(d => d.value.toFixed(1));

        // Add count labels
        g.selectAll('.count-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'count-label')
            .attr('x', d => (x(d.category) as number) + x.bandwidth() / 2)
            .attr('y', innerHeight + 35)
            .attr('text-anchor', 'middle')
            .attr('fill', 'currentColor')
            .attr('font-size', '10px')
            .attr('opacity', 0.7)
            .text(d => `${d.count.toLocaleString()} (${d.percentage.toFixed(1)}%)`);

        // X axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('fill', 'currentColor');

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text')
            .attr('fill', 'currentColor');

        // Y axis label
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 15)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .attr('fill', 'currentColor')
            .attr('font-size', '12px')
            .text(getMetricLabel(metric));

        // Style axis lines
        g.selectAll('.domain, .tick line')
            .attr('stroke', 'currentColor')
            .attr('opacity', 0.3);
    }

    function getMetricLabel(metric: string): string {
        const labels: Record<string, string> = {
            'mean_engagement': 'Avg Engagement',
            'mean_reactions': 'Avg Reactions',
            'mean_comments': 'Avg Comments',
            'mean_restacks': 'Avg Restacks'
        };
        return labels[metric] || metric;
    }

    $effect(() => {
        // Redraw when data changes
        data;
        drawChart();
    });
</script>

<div class="card preset-tonal-surface">
    <header class="card-header">
        <h4 class="h4 capitalize">{title.replace(/_/g, ' ')}</h4>
        <p class="text-xs text-surface-600-300-token mt-1">
            Effect: {data.effect_percentage > 0 ? '+' : ''}{data.effect_percentage.toFixed(1)}%
        </p>
    </header>
    <div bind:this={chartContainer} class="p-4" style="height: {height + 40}px">
        <!-- Chart renders here -->
    </div>
</div>