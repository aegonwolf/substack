<script lang="ts">
    import { onMount } from 'svelte';
    import { scaleLinear, scaleSqrt, axisLeft, axisBottom, extent, select, pointer } from 'd3';

    export type TopicRow = {
        id: string; label?: string;
        post_count?: number; pub_count?: number; subscriber_sum?: number; avg_subscriber_count?: number;
        avg_reactions?: number; avg_comments?: number; avg_restacks?: number;
        avg_reactions_per_1k?: number; avg_comments_per_1k?: number; avg_restacks_per_1k?: number;
    };

    interface Props {
        items?: TopicRow[];
        xKey?: keyof TopicRow;
        yKey?: keyof TopicRow;
        title?: string;
    }

    let { items = [], xKey = 'avg_subscriber_count', yKey = 'avg_reactions_per_1k', title = 'Engagement vs Audience' }: Props = $props();

    let container: HTMLDivElement;
    let tooltipEl: HTMLDivElement;
    let width = $state(600);
    let height = $state(360);

    const processed = $derived.by(() => {
        return items.map(d => ({
            x: Number((d as any)[xKey]) || 0,
            y: Number((d as any)[yKey]) || 0,
            r: Number(d.post_count) || 0,
            name: d.label || d.id,
        })).filter(d => Number.isFinite(d.x) && Number.isFinite(d.y));
    });

    function draw() {
        if (!container) return;
        const data = processed;

        select(container).selectAll('*').remove();
        const m = { top: 12, right: 20, bottom: 36, left: 48 };
        const w = width, h = height;
        const iw = Math.max(100, w - m.left - m.right);
        const ih = Math.max(100, h - m.top - m.bottom);
        const svg = select(container).append('svg').attr('width', w).attr('height', h);
        const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

        const xExt = extent(data, d => d.x) as [number, number];
        const yExt = extent(data, d => d.y) as [number, number];
        const x = scaleLinear().domain([0, (xExt?.[1] ?? 1) * 1.05]).range([0, iw]);
        const y = scaleLinear().domain([0, (yExt?.[1] ?? 1) * 1.05]).range([ih, 0]);
        const r = scaleSqrt().domain([0, Math.max(1, extent(data, d => d.r)?.[1] || 1)]).range([3, 18]);

        const dots = g.selectAll('circle').data(data).enter().append('circle')
            .attr('cx', d => x(d.x))
            .attr('cy', d => y(d.y))
            .attr('r', d => r(d.r))
            .attr('fill', '#10b981')
            .attr('fill-opacity', 0.6)
            .attr('stroke', '#065f46')
            .attr('stroke-opacity', 0.5);

        g.append('g').attr('transform', `translate(0,${ih})`).call(axisBottom(x).ticks(5)).selectAll('text').attr('fill', 'currentColor');
        g.append('g').call(axisLeft(y).ticks(5)).selectAll('text').attr('fill', 'currentColor');
        g.selectAll('.domain, .tick line').attr('stroke', 'currentColor').attr('opacity', 0.3);

        // Tooltip handlers
        const show = (event: MouseEvent, d: any) => {
            if (!tooltipEl) return;
            const [px, py] = pointer(event, container);
            tooltipEl.style.display = 'block';
            tooltipEl.style.left = px + 12 + 'px';
            tooltipEl.style.top = py + 12 + 'px';
            tooltipEl.innerHTML = `<div class="text-xs"><div class="font-semibold">${d.name}</div>
                <div>Audience: ${Math.round(d.x).toLocaleString()}</div>
                <div>Metric: ${Math.round(d.y).toLocaleString()}</div>
                <div>Posts: ${Math.round(d.r).toLocaleString()}</div></div>`;
        };
        const hide = () => { if (tooltipEl) tooltipEl.style.display = 'none'; };

        dots.on('mousemove', function (event, d) { show(event, d); })
            .on('mouseout', hide)
            .on('click', function(event, d){ show(event, d); });
    }

    onMount(() => {
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                width = e.contentRect.width; draw();
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
        <p class="text-xs text-surface-600-300-token">x: {String(xKey).replace(/_/g,' ')}, y: {String(yKey).replace(/_/g,' ')}</p>
    </div>
    <div class="relative p-4" bind:this={container} style="min-height: 360px">
        <div bind:this={tooltipEl} class="pointer-events-none absolute hidden rounded-md border border-surface-600/50 bg-surface-800/95 p-2 text-on-surface shadow-xl" style="display:none"></div>
    </div>
</div>
