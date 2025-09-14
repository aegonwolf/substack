<script lang="ts">
  // Engagement Line Chart Component
  //
  // A line chart for visualizing engagement patterns over time
  // Built with Svelte 5 and D3 based on the football template
  //
  // Features:
  // - Temporal engagement visualization (hourly/yearly)
  // - Custom HTML tooltips with smart positioning
  // - Smooth D3 path animations
  // - Responsive design with automatic sizing
  // - Dark mode support
  // - Full accessibility compliance
  //
  // Usage:
  // <EngagementLineChart {data} chartType="hourly" />

  import * as d3 from "d3";
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  // Data interfaces
  interface HourlyData {
    hour: number;
    count: number;
    mean_engagement: number;
    mean_reactions: number;
    mean_comments: number;
    mean_restacks: number;
  }

  interface YearlyData {
    year: number;
    count: number;
    mean_engagement: number;
    mean_reactions: number;
    mean_comments: number;
    mean_restacks: number;
  }

  interface ProcessedDataPoint {
    x: number;
    value: number;
    count: number;
    reactions: number;
    comments: number;
    restacks: number;
    label: string;
  }

  // Component props
  interface Props {
    data: { data: HourlyData[] | YearlyData[] };
    chartType: 'hourly' | 'yearly';
    metric?: 'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks';
    title?: string;
    height?: number;
    transitionDuration?: number;
    showCircles?: boolean;
  }

  let {
    data,
    chartType = 'hourly',
    metric = 'mean_engagement',
    title = "",
    height = 400,
    transitionDuration = 2000,
    showCircles = true
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
  const margin = { top: 20, right: 60, bottom: 60, left: 80 };

  // Animation control - all reactive state
  let pathElement = $state<SVGPathElement | undefined>();
  let animationFrame = $state<number | undefined>();
  let isAnimating = $state(false);
  let dataVersion = $state(0);
  let lastAnimatedVersion = $state(0);
  let initialRenderComplete = $state(false);

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
  const lineColor = "#3b82f6"; // Blue color for the line

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

  // Process engagement data into chart format
  const processedData = $derived.by(() => {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    const points: ProcessedDataPoint[] = [];

    for (const item of data.data) {
      let x: number;
      let label: string;

      if (chartType === 'hourly') {
        const hourlyItem = item as HourlyData;
        x = hourlyItem.hour;
        label = `${hourlyItem.hour}:00`;
      } else {
        const yearlyItem = item as YearlyData;
        x = yearlyItem.year;
        label = yearlyItem.year.toString();
      }

      points.push({
        x,
        value: item[metric],
        count: item.count,
        reactions: item.mean_reactions,
        comments: item.mean_comments,
        restacks: item.mean_restacks,
        label
      });
    }

    return points.sort((a, b) => a.x - b.x);
  });

  // Scales
  const xScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const xValues = processedData.map(d => d.x);
    const minX = d3.min(xValues) || 0;
    const maxX = d3.max(xValues) || 1;

    return d3.scaleLinear()
      .domain([minX, maxX])
      .range([0, width - margin.left - margin.right]);
  });

  const yScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const values = processedData.map(d => d.value);
    let yMin = d3.min(values) || 0;
    let yMax = d3.max(values) || 1;

    if (yMin > 0) yMin = 0;
    if (yMin === yMax) {
      yMin = Math.max(0, yMin - Math.abs(yMin) * 0.1 - 1);
      yMax = yMax + Math.abs(yMax) * 0.1 + 1;
    }

    const padding = (yMax - yMin) * 0.05;
    return d3.scaleLinear()
      .domain([yMin - (yMin > 0 ? 0 : padding), yMax + padding])
      .range([height - margin.top - margin.bottom, 0]);
  });

  // Path creation for animation
  const pathString = $derived.by(() => {
    if (processedData.length < 2) return "";

    const lineGenerator = d3.line<ProcessedDataPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.value))
      .curve(d3.curveCardinal);

    return lineGenerator(processedData) || "";
  });

  // Animation functions
  function getPathLength(pathEl: SVGPathElement): number {
    try {
      return pathEl.getTotalLength();
    } catch (e) {
      return 0;
    }
  }

  function updatePathTrimming(pathEl: SVGPathElement, progress: number) {
    const length = getPathLength(pathEl);
    if (length > 0) {
      const visibleLength = length * progress;
      pathEl.style.strokeDasharray = `${visibleLength} ${length}`;
      pathEl.style.strokeDashoffset = '0';
    }
  }

  function startLineAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (isAnimating || !pathElement || !pathElement.isConnected) return;

    isAnimating = true;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);

      if (pathElement && pathElement.isConnected) {
        updatePathTrimming(pathElement, progress);
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        isAnimating = false;
        initialRenderComplete = true;
        animationFrame = undefined;
      }
    }

    animationFrame = requestAnimationFrame(animate);
  }

  // Animation trigger effect
  $effect(() => {
    if (dataVersion > 0 && processedData.length > 0 && dataVersion !== lastAnimatedVersion) {
      lastAnimatedVersion = dataVersion;

      setTimeout(() => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = undefined;
        }
        isAnimating = false;

        if (pathElement && pathElement.isConnected) {
          pathElement.style.strokeDasharray = '';
          pathElement.style.strokeDashoffset = '';
        }

        startLineAnimation();
      }, 100);
    }
  });

  // Tooltip functions
  function generateTooltip(point: ProcessedDataPoint): string {
    if (chartType === 'hourly') {
      return `${point.label}\nEngagement: ${point.value.toFixed(1)}\nReactions: ${point.reactions.toFixed(1)}\nComments: ${point.comments.toFixed(1)}\nRestacks: ${point.restacks.toFixed(1)}\nPosts: ${point.count.toLocaleString()}`;
    } else {
      return `${point.label}\nEngagement: ${point.value.toFixed(1)}\nReactions: ${point.reactions.toFixed(1)}\nComments: ${point.comments.toFixed(1)}\nRestacks: ${point.restacks.toFixed(1)}\nPosts: ${point.count.toLocaleString()}`;
    }
  }

  function showTooltip(point: ProcessedDataPoint, event: MouseEvent | KeyboardEvent) {
    tooltipContent = generateTooltip(point);
    updateTooltipPosition(event);
    tooltipVisible = true;
  }

  function hideTooltip() {
    tooltipVisible = false;
  }

  function updateTooltipPosition(event: MouseEvent | KeyboardEvent) {
    if (!container) return;

    const rect = container.getBoundingClientRect();

    // Handle both mouse and keyboard events
    let clientX: number, clientY: number;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      // For keyboard events, use the target element position
      const target = event.target as SVGCircleElement;
      const targetRect = target.getBoundingClientRect();
      clientX = targetRect.left + targetRect.width / 2;
      clientY = targetRect.top + targetRect.height / 2;
    }

    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;

    // Smart positioning to keep tooltip in view
    const tooltipWidth = 200; // Approximate width
    const tooltipHeight = 120; // Approximate height for multi-line tooltip
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

  function handleKeyDown(point: ProcessedDataPoint, event: KeyboardEvent) {
    // Show tooltip on Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showTooltip(point, event);
    }
    // Hide tooltip on Escape
    else if (event.key === 'Escape') {
      hideTooltip();
    }
  }

  // Format axis labels
  function formatXAxisLabel(value: number): string {
    if (chartType === 'hourly') {
      return `${Math.round(value)}:00`;
    } else {
      return Math.round(value).toString();
    }
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
</script>

<div bind:this={container} class="w-full relative min-h-[300px]" aria-describedby="chart-description">
  <div id="chart-description" class="sr-only">
    {title ? `${title} - ` : ''}Line chart showing {displayLabel} over {chartType === 'hourly' ? 'hours' : 'years'}.
  </div>

  {#if title}
    <h3 class="text-center font-medium text-lg mb-2 text-gray-900 dark:text-white" id="chart-title">
      {title}
    </h3>
  {:else}
    <h3 class="text-center font-medium text-lg mb-2 text-gray-900 dark:text-white" id="chart-title">
      {displayLabel} by {chartType === 'hourly' ? 'Hour' : 'Year'}
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
        {#if dataVersion > 0 && pathString}
          <!-- Animated line path -->
          <path
            bind:this={pathElement}
            d={pathString}
            fill="none"
            stroke={lineColor}
            stroke-width="3"
            class="line-path"
            aria-label={`${displayLabel} trend over ${chartType}`}
            style="stroke-dasharray: 0 1000; stroke-dashoffset: 0;"
          />

          <!-- Data points with proper accessibility -->
          {#if showCircles}
            {#each processedData as point, pointIndex (point.x)}
              {@const pointDelay = 50 + (pointIndex * 50)}

              <circle
                cx={xScale(point.x)}
                cy={yScale(point.value)}
                r="4"
                fill={lineColor}
                stroke="white"
                stroke-width="2"
                class="data-point cursor-pointer transition-all duration-200 hover:r-6 focus:r-6 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                role="button"
                tabindex="0"
                aria-label={generateTooltip(point)}
                onmouseenter={(e) => showTooltip(point, e)}
                onmouseleave={hideTooltip}
                onmousemove={(e) => handleMouseMove(point, e)}
                onkeydown={(e) => handleKeyDown(point, e)}
                onfocus={(e) => showTooltip(point, e)}
                onblur={hideTooltip}
                in:fly|global={{
                  x: -5, y: 0,
                  duration: 300,
                  delay: pointDelay,
                  easing: quintOut
                }}
              />
            {/each}
          {/if}
        {/if}
      {/key}

      <!-- X axis -->
      <g transform={`translate(0,${height - margin.top - margin.bottom})`} aria-hidden="true">
        {#key dataVersion}
          {#if processedData.length > 0}
            {@const xTicks = xScale.ticks(chartType === 'hourly' ? 8 : Math.min(10, processedData.length))}
            {#each xTicks as tick, i (tick)}
              <text
                x={xScale(tick)}
                y="20"
                text-anchor="middle"
                font-size="12px"
                fill={textColor}
                transition:fade={{ duration: transitionDuration / 2, delay: i * 30 }}
              >
                {formatXAxisLabel(tick)}
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
          y="50"
          text-anchor="middle"
          font-size="14px"
          font-weight="500"
          fill={textColor}
          in:fade={{ duration: transitionDuration / 2 }}
        >
          {chartType === 'hourly' ? 'Hour of Day' : 'Year'}
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
                {tick.toFixed(0)}
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
  .line-path:hover {
    stroke-width: 4;
    filter: drop-shadow(0 0 4px rgba(0,0,0,0.3));
  }

  .data-point:hover {
    r: 6;
    filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  }

  .data-point:focus {
    r: 6;
    filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
  }
</style>

<!--
Usage Examples:

1. Hourly engagement:
<EngagementLineChart data={temporalHourlyData} chartType="hourly" />

2. Yearly trend:
<EngagementLineChart data={temporalYearlyData} chartType="yearly" />

3. Specific metric:
<EngagementLineChart data={temporalHourlyData} chartType="hourly" metric="mean_comments" />

4. Custom title:
<EngagementLineChart data={temporalYearlyData} chartType="yearly" title="Engagement Growth Over Time" />
-->