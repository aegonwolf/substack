<script lang="ts">
    import { onMount } from 'svelte';
    import { hierarchy, treemap, scaleLinear, extent, select, interpolateOranges } from 'd3';

    export type TopicRow = {
        id: string; label?: string;
        post_count?: number; pub_count?: number; subscriber_sum?: number; avg_subscriber_count?: number;
        avg_reactions?: number; avg_comments?: number; avg_restacks?: number;
        avg_reactions_per_1k?: number; avg_comments_per_1k?: number; avg_restacks_per_1k?: number;
    };

    interface Props {
        items?: TopicRow[];
        valueKey?: keyof TopicRow; // size
        colorKey?: keyof TopicRow;
        title?: string;
    }

    let { items = [], valueKey = 'post_count', colorKey = 'avg_reactions_per_1k', title = 'Topic Volume Treemap' }: Props = $props();

    let container: HTMLDivElement;
    let width = $state(600);
    let height = $state(420);

    const processed = $derived.by(() => {
        return items.map(d => ({
            name: d.label || d.id,
            value: Number((d as any)[valueKey]) || 0,
            colorVal: Number((d as any)[colorKey]) || 0
        })).filter(d => d.value > 0);
    });

    function draw() {
        if (!container) return;
        const nodes = processed;

        select(container).selectAll('*').remove();
        const w = width, h = height;
        const svg = select(container).append('svg').attr('width', w).attr('height', h);

        const root = hierarchy({ children: nodes } as any).sum((d: any) => d.value);
        treemap().size([w, h]).paddingInner(2)(root);

        const [mn, mx] = extent(nodes, d => d.colorVal) as [number, number];
        const min = mn ?? 0, max = mx ?? 1; const safeMax = max > min ? max : min + 1;
        const cscale = scaleLinear().domain([min, safeMax]).range([0.05, 1]);

        const cell = svg.selectAll('g').data(root.leaves()).enter().append('g').attr('transform', (d:any) => `translate(${d.x0},${d.y0})`);

        cell.append('rect')
            .attr('width', (d:any) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d:any) => Math.max(0, d.y1 - d.y0))
            .attr('fill', (d:any) => interpolateOranges(cscale(d.data.colorVal)))
            .attr('stroke', 'rgba(255,255,255,0.08)');

        // label only if there's room
        cell.append('text')
            .attr('x', 6)
            .attr('y', 16)
            .attr('fill', 'currentColor')
            .attr('font-size', 11)
            .attr('opacity', (d:any) => ((d.x1 - d.x0) > 80 && (d.y1 - d.y0) > 24) ? 0.95 : 0)
            .text((d:any) => d.data.name);
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
        <p class="text-xs text-surface-600-300-token">Size: {String(valueKey).replace(/_/g,' ')}, Color: {String(colorKey).replace(/_/g,' ')}</p>
    </div>
    <div class="p-4" bind:this={container} style="min-height: 420px"></div>
</div>
