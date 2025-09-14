<script lang="ts">
  // Content Length Bar Chart Component
  //
  // A bar chart for visualizing engagement by content length bins
  // Built with Svelte 5 and D3 for interactive data visualization
  //
  // Features:
  // - Content length bin visualization
  // - Interactive tooltips with detailed metrics
  // - Smooth D3 animations
  // - Responsive design with automatic sizing
  // - Dark mode support
  // - Full accessibility compliance
  //
  // Usage:
  // <ContentLengthChart {data} metric="mean_engagement" />

  import * as d3 from "d3";
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  // Data interfaces
  interface ContentLengthData {
    length_bin: string;
    count: number;
    percentage: number;
    mean_engagement: number;
    median_engagement: number;
    mean_reactions: number;
    mean_comments: number;
    mean_restacks: number;
  }

  interface ProcessedDataPoint {
    bin: string;
    value: number;
    count: number;
    percentage: number;
    reactions: number;
    comments: number;
    restacks: number;
    median: number;
  }

  // Component props
  interface Props {
    data: { data: ContentLengthData[] };
    metric?: 'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks';
    title?: string;
    height?: number;
    transitionDuration?: number;
  }

  let {
    data,
    metric = 'mean_engagement',
    title = "",
    height = 400,
    transitionDuration = 1500
  }: Props = $props();

  // Get display label for the metric
  const displayLabel = $derived.by(() => {
    const labels: Record<string, string> = {
      'mean_engagement': 'Average Engagement',
      'mean_reactions': 'Average Reactions',
      'mean_comments': 'Average Comments',
      'mean_restacks': 'Average Restacks'
    };
    return labels[metric] || metric;
  });

  // Container and dimensions - reactive state
  let container = $state<HTMLDivElement>();
  let width = $state(800);
  const margin = { top: 20, right: 30, bottom: 80, left: 80 };

  // Animation control - reactive state
  let animationFrame = $state<number | undefined>();
  let isAnimating = $state(false);
  let dataVersion = $state(0);
  let lastAnimatedVersion = $state(0);

  // Tooltip state - all reactive
  let tooltipVisible = $state(false);
  let tooltipContent = $state("");
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // Dark mode detection - reactive state
  let isDark = $state(false);
  const textColor = $derived(isDark ? "white" : "#1f2937");
  const gridColor = $derived(isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
  const barColor = "#3b82f6"; // Blue color for bars
  const barHoverColor = "#2563eb"; // Darker blue for hover

  // Data change tracking - reactive state
  let prevDataString = $state("");
  $effect(() => {
    if (data) {
      const currentDataString = JSON.stringify(data);
      if (currentDataString !== prevDataString) {
        dataVersion += 1;
        prevDataString = currentDataString;
      }
    }
  });

  // Process content length data into chart format
  const processedData = $derived.by(() => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    const points: ProcessedDataPoint[] = [];

    for (const item of data.data) {
      points.push({
        bin: item.length_bin,
        value: item[metric],
        count: item.count,
        percentage: item.percentage,
        reactions: item.mean_reactions,
        comments: item.mean_comments,
        restacks: item.mean_restacks,
        median: item.median_engagement
      });
    }

    return points;
  });

  // Scales
  const xScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleBand().domain([]).range([0, 0]);

    return d3.scaleBand()
      .domain(processedData.map(d => d.bin))
      .range([0, width - margin.left - margin.right])
      .padding(0.2);
  });

  const yScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const values = processedData.map(d => d.value);
    const maxValue = d3.max(values) || 1;

    return d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([height - margin.top - margin.bottom, 0]);
  });

  // Color scale for bars based on value
  const colorScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleSequential().domain([0, 1]);

    const values = processedData.map(d => d.value);
    const extent = d3.extent(values) as [number, number];

    return d3.scaleSequential()
      .domain(extent)
      .interpolator(d3.interpolateBlues);
  });

  // Tooltip functions
  function generateTooltip(point: ProcessedDataPoint): string {
    return `Content Length: ${point.bin}\n${displayLabel}: ${point.value.toFixed(1)}\nPosts: ${point.count.toLocaleString()} (${point.percentage.toFixed(1)}%)\nReactions: ${point.reactions.toFixed(1)}\nComments: ${point.comments.toFixed(1)}\nRestacks: ${point.restacks.toFixed(1)}\nMedian Engagement: ${point.median.toFixed(1)}`;
  }

  function showTooltip(point: ProcessedDataPoint, event: MouseEvent) {
    tooltipContent = generateTooltip(point);
    updateTooltipPosition(event);
    tooltipVisible = true;
  }

  function hideTooltip() {
    tooltipVisible = false;
  }

  function updateTooltipPosition(event: MouseEvent) {
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;

    // Smart positioning to keep tooltip in view
    const tooltipWidth = 250; // Approximate width for multi-line content
    const tooltipHeight = 160; // Approximate height for multi-line tooltip
    const padding = 10;

    let x = mouseX + padding;
    let y = mouseY - tooltipHeight - padding;

    // Check right boundary
    if (x + tooltipWidth > width) {
      x = mouseX - tooltipWidth - padding;
    }

    // Check top boundary
    if (y < 0) {
      y = mouseY + padding;
    }

    // Check bottom boundary
    if (y + tooltipHeight > height) {
      y = mouseY - tooltipHeight - padding;
    }

    tooltipX = Math.max(padding, Math.min(x, width - tooltipWidth - padding));
    tooltipY = Math.max(padding, Math.min(y, height - tooltipHeight - padding));
  }

  function handleMouseMove(point: ProcessedDataPoint, event: MouseEvent) {
    updateTooltipPosition(event);
  }

  // Mount and cleanup
  onMount(() => {
    const dmq = window.matchMedia("(prefers-color-scheme: dark)");
    isDark = dmq.matches;

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      isDark = e.matches;
    };

    dmq.addEventListener("change", handleDarkModeChange);

    let resizeObserver: ResizeObserver | undefined;

    if (container) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          width = entry.contentRect.width;
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      dmq.removeEventListener("change", handleDarkModeChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Format numbers for display
  function formatValue(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  }
</script>

<div bind:this={container} class="w-full relative min-h-[300px]" aria-describedby="chart-description">
  <div id="chart-description" class="sr-only">
    {title ? `${title} - ` : ''}Bar chart showing {displayLabel} by content length bins.
  </div>

  {#if title}
    <h3 class="text-center font-medium text-lg mb-2 text-gray-900 dark:text-white" id="chart-title">
      {title}
    </h3>
  {:else}
    <h3 class="text-center font-medium text-lg mb-2 text-gray-900 dark:text-white" id="chart-title">
      {displayLabel} by Content Length
    </h3>
  {/if}

  <!-- Custom HTML Tooltip -->
  {#if tooltipVisible}
    <div
      class="absolute z-50 pointer-events-none bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-700 whitespace-pre-line max-w-xs"
      style="left: {tooltipX}px; top: {tooltipY}px;"
      transition:fade={{ duration: 150 }}
      role="tooltip"
      aria-live="polite"
    >
      {tooltipContent}
      <div class="absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 transform rotate-45 -bottom-1 left-4"></div>
    </div>
  {/if}

  <svg {width} {height} class="w-full h-full" role="img" aria-labelledby="chart-title">
    <g transform={`translate(${margin.left},${margin.top})`}>
      {#key dataVersion}
        {#if dataVersion > 0 && processedData.length > 0}
          <!-- Bars with animations -->
          {#each processedData as point, index (point.bin)}
            {@const barDelay = index * 100}
            {@const barHeight = (height - margin.top - margin.bottom) - yScale(point.value)}

            <g>
              <!-- Bar -->
              <rect
                x={xScale(point.bin)}
                y={yScale(point.value)}
                width={xScale.bandwidth()}
                height={barHeight}
                fill={colorScale(point.value)}
                stroke="white"
                stroke-width="1"
                class="bar cursor-pointer transition-all duration-200 hover:opacity-80"
                role="button"
                tabindex="0"
                aria-label={generateTooltip(point)}
                onmouseenter={(e) => showTooltip(point, e)}
                onmouseleave={hideTooltip}
                onmousemove={(e) => handleMouseMove(point, e)}
                in:fly|global={{
                  y: 50,
                  duration: 400,
                  delay: barDelay,
                  easing: quintOut
                }}
              />

              <!-- Value labels on top of bars -->
              <text
                x={(xScale(point.bin) || 0) + xScale.bandwidth() / 2}
                y={yScale(point.value) - 8}
                text-anchor="middle"
                font-size="12px"
                font-weight="bold"
                fill={textColor}
                class="value-label"
                in:fade={{ duration: 300, delay: barDelay + 200 }}
              >
                {formatValue(point.value)}
              </text>

              <!-- Post count labels below bars -->
              <text
                x={(xScale(point.bin) || 0) + xScale.bandwidth() / 2}
                y={height - margin.top - margin.bottom + 25}
                text-anchor="middle"
                font-size="10px"
                fill={textColor}
                opacity="0.7"
                class="count-label"
                in:fade={{ duration: 300, delay: barDelay + 300 }}
              >
                {point.count.toLocaleString()} posts
              </text>
            </g>
          {/each}
        {/if}
      {/key}

      <!-- X axis -->
      <g transform={`translate(0,${height - margin.top - margin.bottom})`} aria-hidden="true">
        {#key dataVersion}
          {#if processedData.length > 0}
            {#each processedData as point, i (point.bin)}
              <text
                x={(xScale(point.bin) || 0) + xScale.bandwidth() / 2}
                y="20"
                text-anchor="middle"
                font-size="12px"
                font-weight="500"
                fill={textColor}
                transition:fade={{ duration: transitionDuration / 2, delay: i * 50 }}
              >
                {point.bin}
              </text>
            {/each}
          {/if}
        {/key}

        <line
          x1="0" y1="0"
          x2={width - margin.left - margin.right} y2="0"
          stroke={textColor}
          stroke-opacity="0.3"
        />

        <text
          x={(width - margin.left - margin.right) / 2}
          y="60"
          text-anchor="middle"
          font-size="14px"
          font-weight="500"
          fill={textColor}
          in:fade={{ duration: transitionDuration / 2 }}
        >
          Content Length
        </text>
      </g>

      <!-- Y axis -->
      <g aria-hidden="true">
        {#key dataVersion}
          {#each yScale.ticks(6) as tick, i (tick)}
            <g transition:fade={{ duration: transitionDuration / 2, delay: i * 50 }}>
              <line
                x1="0" y1={yScale(tick)}
                x2={width - margin.left - margin.right} y2={yScale(tick)}
                stroke={gridColor}
                stroke-dasharray="5,5"
              />
              <text
                x="-10" y={yScale(tick)}
                dy=".32em"
                text-anchor="end"
                font-size="12px"
                fill={textColor}
              >
                {formatValue(tick)}
              </text>
            </g>
          {/each}
        {/key}

        <text
          transform="rotate(-90)"
          y="-50"
          x={-(height - margin.top - margin.bottom) / 2}
          dy=".71em"
          text-anchor="middle"
          font-size="14px"
          font-weight="500"
          fill={textColor}
          in:fade={{ duration: transitionDuration / 2 }}
        >
          {displayLabel}
        </text>
      </g>
    </g>
  </svg>
</div>

<style>
  .bar:hover {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .value-label {
    pointer-events: none;
  }

  .count-label {
    pointer-events: none;
  }
</style>

<!--
Usage Examples:

1. Basic usage:
<ContentLengthChart data={contentLengthData} />

2. Specific metric:
<ContentLengthChart data={contentLengthData} metric="mean_comments" />

3. Custom title:
<ContentLengthChart data={contentLengthData} title="Engagement by Article Length" />

4. Custom height:
<ContentLengthChart data={contentLengthData} height={500} />
-->