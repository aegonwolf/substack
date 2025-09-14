<script lang="ts">
    import { onMount } from 'svelte';
    import { scaleLinear } from 'd3';

    interface Props {
        topicId: string;
        metricKey?: 'avg_reactions_per_1k' | 'avg_comments_per_1k' | 'avg_restacks_per_1k';
        height?: number;
        stroke?: string;
    }

    let { topicId, metricKey = 'avg_reactions_per_1k', height = 28, stroke = '#fb923c' }: Props = $props();

    let width = $state(120);
    let series = $state<Array<{ month: string; [k: string]: number }>>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let container: HTMLDivElement;

    function slugify(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function generateLastMonths(n = 12): string[] {
        const now = new Date();
        const months: string[] = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
            months.push(`${d.getUTCFullYear()}-${m}`);
        }
        return months;
    }

    function toPath(vals: number[], w: number, h: number): string {
        if (!vals.length) return '';
        const xStep = w / (vals.length - 1 || 1);
        const yScale = scaleLinear().domain([Math.min(...vals), Math.max(...vals) || 1]).nice().range([h - 2, 2]);
        let d = '';
        for (let i = 0; i < vals.length; i++) {
            const x = i * xStep;
            const y = yScale(vals[i] || 0);
            d += (i === 0 ? `M${x},${y}` : `L${x},${y}`);
        }
        return d;
    }

    async function load() {
        loading = true; error = null;
        try {
            const slug = slugify(topicId);
            const res = await fetch(`/jsons/topic_explorer/timeseries/${slug}.json`);
            if (!res.ok) throw new Error('not-found');
            const json = await res.json();
            series = Array.isArray(json?.series) ? json.series : [];
        } catch (e) {
            error = 'missing';
            series = [];
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        const ro = new ResizeObserver(entries => {
            for (const e of entries) width = e.contentRect.width;
        });
        if (container) ro.observe(container);
        load();
        return () => ro.disconnect();
    });

    const months = $derived.by(() => generateLastMonths(12));
    const values = $derived.by<number[]>(() => {
        if (!series.length) return [];
        const map = new Map(series.map(d => [d.month, d]));
        return months.map(m => Number((map.get(m) || {})[metricKey]) || 0);
    });
    const pathD = $derived.by(() => values.length ? toPath(values, Math.max(40, width), height) : '');
</script>

<div class="w-full" bind:this={container}>
    {#if error === 'missing'}
        <div class="text-xs text-surface-500-400-token">—</div>
    {:else}
        <svg width="100%" {height} viewBox={`0 0 ${Math.max(40, width)} ${height}`} preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke={stroke} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
    {/if}
    
</div>

