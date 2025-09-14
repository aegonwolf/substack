<script lang="ts">
    import { onMount } from 'svelte';
    import { scaleBand, scaleLinear, axisLeft, axisBottom, max, select, format as d3format } from 'd3';

    export type TopicRow = {
        id: string; label?: string;
        post_count?: number; pub_count?: number; subscriber_sum?: number; avg_subscriber_count?: number;
        avg_reactions?: number; avg_comments?: number; avg_restacks?: number;
        avg_reactions_per_1k?: number; avg_comments_per_1k?: number; avg_restacks_per_1k?: number;
    };

    interface Props {
        items?: TopicRow[];
        metricKey?: keyof TopicRow;
        topN?: number;
        title?: string;
    }

    let { items = [], metricKey = 'avg_reactions_per_1k', topN = 20, title = 'Top Topics' }: Props = $props();

    let container: HTMLDivElement;
    let width = $state(600);
    let height = $state(420);

    const fmt = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.round(n).toString();

    const processed = $derived.by(() => {
        return [...items]
            .map(d => ({...d, value: Number((d as any)[metricKey]) || 0, name: d.label || d.id }))
            .filter(d => Number.isFinite(d.value))
            .sort((a, b) => b.value - a.value)
            .slice(0, topN)
            .reverse();
    });

    function draw() {
        if (!container) return;
        const data = processed;

        select(container).selectAll('*').remove();
        const m = { top: 20, right: 24, bottom: 32, left: 160 };
        const w = width;
        const h = height;
        const iw = Math.max(100, w - m.left - m.right);
        const ih = Math.max(100, h - m.top - m.bottom);

        const svg = select(container).append('svg').attr('width', w).attr('height', h);
        const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

        const y = scaleBand().domain(data.map(d => d.name)).range([0, ih]).padding(0.15);
        const x = scaleLinear().domain([0, (max(data, d => d.value) || 1) * 1.05]).range([0, iw]);

        g.selectAll('rect').data(data).enter().append('rect')
            .attr('x', 0).attr('y', d => y(d.name) as number)
            .attr('width', d => x(d.value))
            .attr('height', y.bandwidth())
            .attr('fill', '#f59e0b')
            .attr('rx', 4);

        // labels at bar end
        g.selectAll('text.value').data(data).enter().append('text')
            .attr('class', 'value')
            .attr('x', d => x(d.value) + 6)
            .attr('y', d => (y(d.name) as number) + y.bandwidth()/2)
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'currentColor')
            .attr('font-size', 12)
            .text(d => fmt(d.value));

        g.append('g').call(axisLeft(y)).selectAll('text').attr('fill', 'currentColor');
        g.append('g').attr('transform', `translate(0,${ih})`).call(axisBottom(x).ticks(5)).selectAll('text').attr('fill', 'currentColor');
        g.selectAll('.domain, .tick line').attr('stroke', 'currentColor').attr('opacity', 0.3);
    }

    onMount(() => {
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                width = e.contentRect.width;
                height = Math.max(360, Math.min(800, items.length * 18 + 120));
                draw();
            }
        });
        if (container) ro.observe(container);
        draw();
        return () => ro.disconnect();
    });

    $effect(() => { processed; draw(); });
</script>

<div class="card preset-tonal-surface">
    <div class="card-header">
        <h3 class="h4">{title}</h3>
        <p class="text-xs text-surface-600-300-token">Metric: {String(metricKey).replace(/_/g,' ')}</p>
    </div>
    <div class="p-4" bind:this={container} style="min-height: 360px"></div>
    <div class="p-3 text-right text-xs text-surface-500-400-token">Orange bars = higher values</div>
    
</div>
