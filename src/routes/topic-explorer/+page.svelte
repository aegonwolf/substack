<script lang="ts">
    import type { PageData } from './$types';

    interface Props { data: PageData }
    let { data }: Props = $props();
    import { scaleLinear, extent, interpolateOranges } from 'd3';
    import TopNBar from '$lib/components/topic-explorer/TopNBar.svelte';
    import Scatter from '$lib/components/topic-explorer/Scatter.svelte';
    import Sparkline from '$lib/components/topic-explorer/Sparkline.svelte';

    type GraphNode = {
        id: string;
        type?: string;
        subscriber_sum?: number;
        avg_subscriber_count?: number;
        pub_count?: number;
        post_count?: number;
        avg_reactions?: number;
        avg_comments?: number;
        avg_restacks?: number;
        avg_reactions_per_1k?: number;
        avg_comments_per_1k?: number;
        avg_restacks_per_1k?: number;
        label?: string;
    };

    const isLoading = $derived(!data || !data.index);
    const hasError = $derived(!!data?.error);

    // We don't care about graph connections here; prefer co_occurrence if present, else by_publication

    // table controls
    let search = $state('');
    let sortKey = $state<
        'id' | 'post_count' | 'pub_count' | 'subscriber_sum' | 'avg_subscriber_count' |
        'avg_reactions' | 'avg_comments' | 'avg_restacks' |
        'avg_reactions_per_1k' | 'avg_comments_per_1k' | 'avg_restacks_per_1k'
    >('post_count');
    let sortDir = $state<'desc' | 'asc'>('desc');
    let page = $state(1);
    let pageSize = $state(25);

    // Visualization controls (scatter)
    type BaseMetric = 'avg_reactions' | 'avg_comments' | 'avg_restacks';
    let vizMetric = $state<BaseMetric>('avg_reactions');
    let vizNormalized = $state<boolean>(true);
    const currentMetricKey = $derived.by<MetricKey>(() => vizNormalized ? (vizMetric + '_per_1k') as MetricKey : vizMetric);

    // Bar chart controls (can include non-engagement meta)
    type BarBase = BaseMetric | 'avg_subscriber_count' | 'post_count' | 'pub_count' | 'subscriber_sum';
    let barMetricBase = $state<BarBase>('avg_reactions');
    let barNormalized = $state<boolean>(true);
    const barMetricKey = $derived.by<keyof GraphNode>(() => {
        const canNorm = barMetricBase === 'avg_reactions' || barMetricBase === 'avg_comments' || barMetricBase === 'avg_restacks';
        if (canNorm && barNormalized) return (barMetricBase + '_per_1k') as keyof GraphNode;
        return barMetricBase as keyof GraphNode;
    });

    function formatNumber(n?: number | null): string {
        if (n == null || Number.isNaN(n)) return '-';
        if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k';
        return Math.round(n).toLocaleString();
    }

    const nodes = $derived.by<GraphNode[]>(() => {
        const section = data?.index?.co_occurrence ?? data?.index?.by_publication;
        return Array.isArray(section?.topics) ? (section.topics as GraphNode[]) : [];
    });

    type MetricKey = 'avg_subscriber_count' | 'avg_reactions' | 'avg_comments' | 'avg_restacks' | 'avg_reactions_per_1k' | 'avg_comments_per_1k' | 'avg_restacks_per_1k';

    // Selection state for custom comparisons (depends on nodes)
    let selectedIds = $state<string[]>([]);
    const byId = $derived.by(() => {
        const map = new Map<string, GraphNode>();
        for (const n of nodes) map.set(n.id, n);
        return map;
    });
    function addSelection(id: string) {
        if (!selectedIds.includes(id)) selectedIds = [...selectedIds, id];
    }
    function removeSelection(id: string) {
        selectedIds = selectedIds.filter(x => x !== id);
    }
    function clearSelection() { selectedIds = []; }
    const selectedItems = $derived.by<GraphNode[]>(() => selectedIds.map(id => byId.get(id)).filter(Boolean) as GraphNode[]);

    function makeHeat(metric: MetricKey) {
        const values = nodes.map((n) => Number((n as any)[metric]) || 0).filter((v) => Number.isFinite(v)) as number[];
        const [mn, mx] = extent(values) as [number | undefined, number | undefined];
        const min = (mn ?? 0);
        const max = (mx ?? min);
        const safeMax = max > min ? max : min + 1;
        const s = scaleLinear().domain([min, safeMax]).range([0.05, 1]).clamp(true);
        return (v: number | undefined) => {
            const val = Number(v) || 0;
            const t = s(val);
            return { t, color: interpolateOranges(t) };
        };
    }

    function textColorFor(bg: string): string {
        // expects rgb(r, g, b) or rgba(r,g,b,a)
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return '#ffffff';
        const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        // YIQ luminance
        const yiq = (r*299 + g*587 + b*114) / 1000;
        return yiq >= 140 ? '#0b0f1a' : '#ffffff';
    }

    const heat = $derived.by(() => ({
        avg_subscriber_count: makeHeat('avg_subscriber_count'),
        avg_reactions: makeHeat('avg_reactions'),
        avg_comments: makeHeat('avg_comments'),
        avg_restacks: makeHeat('avg_restacks'),
        avg_reactions_per_1k: makeHeat('avg_reactions_per_1k'),
        avg_comments_per_1k: makeHeat('avg_comments_per_1k'),
        avg_restacks_per_1k: makeHeat('avg_restacks_per_1k'),
    }));

    const filtered = $derived.by<GraphNode[]>(() => {
        const q = search.trim().toLowerCase();
        if (!q) return nodes;
        return nodes.filter(n =>
            (n.label || n.id).toLowerCase().includes(q)
        );
    });

    const sorted = $derived.by<GraphNode[]>(() => {
        const key = sortKey;
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const av = (a as any)[key] ?? (key === 'id' ? a.id : 0);
            const bv = (b as any)[key] ?? (key === 'id' ? b.id : 0);
            if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir;
            const na = Number(av) || 0, nb = Number(bv) || 0;
            return (na - nb) * dir;
        });
    });

    const totalPages = $derived.by(() => Math.max(1, Math.ceil(sorted.length / pageSize)));
    const pageItems = $derived.by(() => sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize));

    function setSort(key: typeof sortKey) {
        if (sortKey === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortKey = key;
            sortDir = 'desc';
        }
    }

    // Avoid $effect for simple UI resets; reset page in UI handlers instead
</script>

<svelte:head>
    <title>Topic Explorer</title>
    <meta name="description" content="Browse topics with engagement and subscriber-normalized metrics" />
    <meta name="robots" content="noindex" />
    <!-- This is a dev page; hide from crawlers by default -->
    <!-- NOTE: If deployed publicly, adjust as needed. -->
</svelte:head>

    <div class="container mx-auto max-w-7xl space-y-6 px-4 py-4 md:space-y-8 md:px-6">
    <header class="space-y-2 text-center">
        <h1 class="gradient-heading h1 leading-tight">Topic Explorer</h1>
        <p class="text-surface-600-300-token">Per-topic engagement with per‑1k normalization</p>
    </header>

    {#if isLoading}
        <div class="flex flex-col items-center justify-center space-y-6 py-16">
            <div class="bg-surface-300-600-token placeholder-circle h-16 w-16 animate-pulse"></div>
            <p class="text-surface-700-200-token">Loading topic graphs…</p>
        </div>
    {:else if hasError}
        <div class="card preset-filled-error-500 p-6 text-center">
            <h2 class="h3 text-white">Failed to load topics</h2>
            <p class="text-error-100">{data?.error}</p>
        </div>
    {:else}
        <!-- Controls -->
        <section class="card preset-tonal-surface p-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="flex items-center gap-3 relative">
                    <label class="font-medium">Search</label>
                    <div class="relative w-full">
                        <input class="input w-full preset-outlined-surface-200-800" placeholder="Search topics…" bind:value={search} oninput={() => (page = 1)} />
                        {#if search.trim() && filtered.length > 0}
                            <div class="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-surface-600 bg-surface-800/95 text-on-surface shadow-xl backdrop-blur-sm">
                                {#each filtered.slice(0, 8) as s}
                                    <button class="w-full border-b border-surface-600 p-2 text-left last:border-b-0 hover:bg-surface-700" onclick={() => { addSelection(s.id); search = ''; page = 1; }}>
                                        <div class="text-sm font-medium">{s.label || s.id}</div>
                                        <div class="mt-0.5 text-xs text-surface-400">
                                            {formatNumber(s.post_count)} posts • {formatNumber(s.subscriber_sum)} subs
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <label class="font-medium">Sort by</label>
                    <select class="select preset-outlined-surface-200-800" bind:value={sortKey} onchange={() => (page = 1)}>
                        <option value="post_count">Posts</option>
                        <option value="pub_count">Publications</option>
                        <option value="subscriber_sum">Subscribers</option>
                        <option value="avg_subscriber_count">Avg subs</option>
                        <option value="avg_reactions">Reactions</option>
                        <option value="avg_comments">Comments</option>
                        <option value="avg_restacks">Restacks</option>
                        <option value="avg_reactions_per_1k">Reactions /1k</option>
                        <option value="avg_comments_per_1k">Comments /1k</option>
                        <option value="avg_restacks_per_1k">Restacks /1k</option>
                        <option value="id">Topic</option>
                    </select>
                    <button class="btn btn-sm preset-tonal-surface" onclick={() => sortDir = sortDir === 'asc' ? 'desc' : 'asc'}>
                        {sortDir === 'asc' ? 'Asc' : 'Desc'}
                    </button>
                </div>
                <div class="flex items-center gap-3 justify-between md:justify-start">
                    <div class="text-sm text-surface-600-300-token">{filtered.length.toLocaleString()} topics</div>
                    <div class="flex items-center gap-2">
                        <label class="font-medium">Rows</label>
                        <select class="select preset-outlined-surface-200-800" bind:value={pageSize}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <button class="btn btn-sm preset-tonal-surface" disabled={page<=1} onclick={() => page = Math.max(1, page-1)}>Prev</button>
                        <span class="text-sm">Page {page} / {totalPages}</span>
                        <button class="btn btn-sm preset-tonal-surface" disabled={page>=totalPages} onclick={() => page = Math.min(totalPages, page+1)}>Next</button>
                    </div>
                </div>
            </div>
        </section>

        {#if selectedIds.length}
            <section class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-surface-600-300-token">Selected:</span>
                {#each selectedItems as s}
                    <span class="badge preset-filled-primary-500 cursor-pointer" title="Remove" onclick={() => removeSelection(s.id)}>{s.label || s.id} ✕</span>
                {/each}
                <button class="btn btn-xs preset-tonal-surface ml-2" onclick={clearSelection}>Clear all</button>
            </section>
        {/if}

        <!-- Table (first) -->
        <section class="card preset-tonal-surface overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th></th>
                        <th class="cursor-pointer" onclick={() => setSort('id')}>Topic</th>
                        <th class="w-36">Trend</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('post_count')}>Posts</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('pub_count')}>Pubs</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('subscriber_sum')}>Subscribers</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('avg_subscriber_count')}>Avg subs</th>
                        <th class="cursor-pointer" onclick={() => setSort('avg_reactions')}>Reactions</th>
                        <th class="cursor-pointer" onclick={() => setSort('avg_comments')}>Comments</th>
                        <th class="cursor-pointer" onclick={() => setSort('avg_restacks')}>Restacks</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('avg_reactions_per_1k')}>Reactions /1k</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('avg_comments_per_1k')}>Comments /1k</th>
                        <th class="cursor-pointer whitespace-nowrap" onclick={() => setSort('avg_restacks_per_1k')}>Restacks /1k</th>
                    </tr>
                </thead>
                <tbody>
                    {#each pageItems as n}
                        <tr>
                            <td class="w-10">
                                {#if selectedIds.includes(n.id)}
                                    <button class="btn btn-xs preset-filled-primary-500" title="Remove from comparison" onclick={() => removeSelection(n.id)}>✓</button>
                                {:else}
                                    <button class="btn btn-xs preset-tonal-surface" title="Add to comparison" onclick={() => addSelection(n.id)}>+</button>
                                {/if}
                            </td>
                            <td class="font-medium">{n.label || n.id}</td>
                            <td>
                                <Sparkline topicId={n.id} metricKey={'avg_reactions_per_1k'} height={24} />
                            </td>
                            <td>{formatNumber(n.post_count)}</td>
                            <td>{formatNumber(n.pub_count)}</td>
                            <td>{formatNumber(n.subscriber_sum)}</td>
                            {#key nodes}
                                {@const h1 = heat.avg_subscriber_count(n.avg_subscriber_count)}
                                <td style={`background:${h1.color};color:${textColorFor(h1.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_subscriber_count)}</td>
                                {@const h2 = heat.avg_reactions(n.avg_reactions)}
                                <td style={`background:${h2.color};color:${textColorFor(h2.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_reactions)}</td>
                                {@const h3 = heat.avg_comments(n.avg_comments)}
                                <td style={`background:${h3.color};color:${textColorFor(h3.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_comments)}</td>
                                {@const h4 = heat.avg_restacks(n.avg_restacks)}
                                <td style={`background:${h4.color};color:${textColorFor(h4.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_restacks)}</td>
                                {@const k1 = heat.avg_reactions_per_1k(n.avg_reactions_per_1k)}
                                <td style={`background:${k1.color};color:${textColorFor(k1.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_reactions_per_1k)}</td>
                                {@const k2 = heat.avg_comments_per_1k(n.avg_comments_per_1k)}
                                <td style={`background:${k2.color};color:${textColorFor(k2.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_comments_per_1k)}</td>
                                {@const k3 = heat.avg_restacks_per_1k(n.avg_restacks_per_1k)}
                                <td style={`background:${k3.color};color:${textColorFor(k3.color)}`}
                                    class={`px-2 font-semibold`}>{formatNumber(n.avg_restacks_per_1k)}</td>
                            {/key}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>

        <!-- Footer pagination duplicate for convenience -->
        <section class="flex items-center justify-center gap-3">
            <button class="btn btn-sm preset-tonal-surface" disabled={page<=1} onclick={() => page = Math.max(1, page-1)}>Prev</button>
            <span class="text-sm text-surface-600-300-token">Page {page} of {totalPages}</span>
            <button class="btn btn-sm preset-tonal-surface" disabled={page>=totalPages} onclick={() => page = Math.min(totalPages, page+1)}>Next</button>
        </section>

        <!-- Compare strip controls -->
        {#if selectedIds.length}
        <section class="card preset-tonal-surface p-4">
            <div class="flex flex-wrap items-center gap-3">
                <label class="font-medium">Compare metric</label>
                <select class="select preset-outlined-surface-200-800" bind:value={vizMetric}>
                    <option value="avg_reactions">Reactions /1k</option>
                    <option value="avg_comments">Comments /1k</option>
                    <option value="avg_restacks">Restacks /1k</option>
                </select>
                <span class="text-xs text-surface-600-300-token">Aligned to last 12 months</span>
            </div>
        </section>
        {/if}

        <!-- Visualizations (after table) -->
        <section class="card preset-tonal-surface p-4">
            <div class="flex flex-wrap items-center gap-3">
                <label class="font-medium">Bar metric</label>
                <select class="select preset-outlined-surface-200-800" bind:value={barMetricBase} onchange={() => (page = 1)}>
                    <optgroup label="Engagement (avg per post)">
                        <option value="avg_reactions">Reactions</option>
                        <option value="avg_comments">Comments</option>
                        <option value="avg_restacks">Restacks</option>
                    </optgroup>
                    <optgroup label="Other">
                        <option value="avg_subscriber_count">Avg subscribers</option>
                        <option value="post_count">Posts</option>
                        <option value="pub_count">Publications</option>
                        <option value="subscriber_sum">Total subscribers</option>
                    </optgroup>
                </select>
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" class="checkbox" bind:checked={barNormalized} />
                    <span class="text-sm">Per 1,000 subs</span>
                </label>
                <span class="text-xs text-surface-600-300-token">Tip: select topics above to compare specific ones</span>
            </div>
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopNBar items={selectedItems.length ? selectedItems : filtered} metricKey={barMetricKey} topN={20} title={`${selectedItems.length ? 'Selected topics' : 'Top 20'} by ${String(barMetricKey).replace(/_/g,' ')}`}/>
            <Scatter items={filtered} xKey={'avg_subscriber_count'} yKey={currentMetricKey} title="Engagement vs Audience"/>
        </section>

        {#if selectedIds.length}
        <section class="card preset-tonal-surface p-4">
            <h3 class="h4 mb-2">Selected: 12‑month trend</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each selectedItems as s}
                    <div class="rounded-md border border-surface-600 p-3">
                        <div class="mb-1 text-sm font-semibold">{s.label || s.id}</div>
                        <Sparkline topicId={s.id} metricKey={(vizMetric + '_per_1k') as any} height={40} />
                    </div>
                {/each}
            </div>
        </section>
        {/if}
    {/if}
</div>
