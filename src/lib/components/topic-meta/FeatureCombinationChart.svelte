<script lang="ts">

  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  // Data interfaces
  interface CombinationData {
    combination: string;
    feature1_value: number;
    feature2_value: number;
    count: number;
    percentage: number;
    mean_engagement: number;
    mean_reactions: number;
    mean_comments: number;
    mean_restacks: number;
  }

  interface ProcessedDataPoint extends CombinationData {
    value: number;
    colorIndex: number;
  }

  // Component props
  interface Props {
    data: {
      feature1: string;
      feature2: string;
      combinations: CombinationData[];
    };
    metric?: 'mean_engagement' | 'mean_reactions' | 'mean_comments' | 'mean_restacks';
    title?: string;
    height?: number;
    transitionDuration?: number;
  }

  let {
    data,
    metric = 'mean_engagement',
    title = "",
    height = 350,
    transitionDuration = 1000
  }: Props = $props();

  // Get display labels
  const displayLabel = $derived.by(() => {
    const labels: Record<string, string> = {
      'mean_engagement': 'Average Engagement',
      'mean_reactions': 'Average Reactions',
      'mean_comments': 'Average Comments',
      'mean_restacks': 'Average Restacks'
    };
    return labels[metric] || metric;
  });

  const featureLabels = $derived.by(() => {
    if (!data) return { feature1: '', feature2: '' };

    return {
      feature1: data.feature1.replace('has_', '').replace('is_', '').replace(/_/g, ' '),
      feature2: data.feature2.replace('has_', '').replace('is_', '').replace(/_/g, ' ')
    };
  });

  // Container and dimensions - reactive state
  let container = $state<HTMLDivElement>();
  let width = $state(600);
  const margin = { top: 20, right: 30, bottom: 100, left: 80 };

  // Animation control
  let dataVersion = $state(0);

  // Tooltip state - all reactive
  let tooltipVisible = $state(false);
  let tooltipContent = $state("");
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  // Dark mode detection - reactive state
  let isDark = $state(false);
  const textColor = $derived(isDark ? "white" : "#1f2937");
  const gridColor = $derived(isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");

  // Color scheme for combinations - colorblind-friendly palette
  const combinationColors = [
    '#64748b', // Neither - slate-500
    '#0ea5e9', // Feature1 only - sky-500  
    '#f59e0b', // Feature2 only - amber-500
    '#8b5cf6'  // Both - violet-500
  ];

  // Data change tracking
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

  // Process combination data
  const processedData = $derived.by(() => {
    if (!data || !data.combinations) {
      return [];
    }

    const points: ProcessedDataPoint[] = [];

    data.combinations.forEach((combo) => {
      // Assign color based on combination type
      let colorIndex = 0; // Neither (gray)

      if (combo.feature1_value === 1 && combo.feature2_value === 0) {
        colorIndex = 1; // Feature1 only (blue)
      } else if (combo.feature1_value === 0 && combo.feature2_value === 1) {
        colorIndex = 2; // Feature2 only (green)
      } else if (combo.feature1_value === 1 && combo.feature2_value === 1) {
        colorIndex = 3; // Both (red)
      }

      points.push({
        ...combo,
        value: combo[metric],
        colorIndex
      });
    });

    return points;
  });

  // Scales
  const xScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleBand().domain([]).range([0, 0]);

    return d3.scaleBand()
      .domain(processedData.map(d => d.combination))
      .range([0, width - margin.left - margin.right])
      .padding(0.3);
  });

  const yScale = $derived.by(() => {
    if (processedData.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const values = processedData.map(d => d.value);
    const maxValue = d3.max(values) || 1;

    return d3.scaleLinear()
      .domain([0, maxValue * 1.15])
      .range([height - margin.top - margin.bottom, 0]);
  });

  // Tooltip functions
  function generateTooltip(point: ProcessedDataPoint): string {
    return `${point.combination}\n${displayLabel}: ${point.value.toFixed(1)}\nPosts: ${point.count.toLocaleString()} (${point.percentage.toFixed(1)}%)\nReactions: ${point.mean_reactions.toFixed(1)}\nComments: ${point.mean_comments.toFixed(1)}\nRestacks: ${point.mean_restacks.toFixed(1)}`;
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
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Smart positioning
    const tooltipWidth = 220;
    const tooltipHeight = 140;
    const padding = 10;

    let x = mouseX + padding;
    let y = mouseY - tooltipHeight - padding;

    if (x + tooltipWidth > width) {
      x = mouseX - tooltipWidth - padding;
    }

    if (y < 0) {
      y = mouseY + padding;
    }

    tooltipX = Math.max(padding, Math.min(x, width - tooltipWidth - padding));
    tooltipY = Math.max(padding, Math.min(y, height - tooltipHeight - padding));
  }

  function handleMouseMove(_point: ProcessedDataPoint, event: MouseEvent) {
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
    };
  });

  // Format numbers
  function formatValue(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  }

  // Get readable combination label
  function formatCombinationLabel(combo: string): string {
    if (combo === 'Neither') return 'Neither';
    if (combo.includes('_only')) {
      const feature = combo.replace('_only', '');
      return `${featureLabels.feature1 === feature ? featureLabels.feature1 : featureLabels.feature2} only`;
    }
    if (combo === 'Both') return 'Both';
    return combo;
  }
</script>

<div bind:this={container} class="w-full relative min-h-[300px]" aria-describedby="chart-description">
  <div id="chart-description" class="sr-only">
    {title ? `${title} - ` : ''}Bar chart showing {displayLabel} for different feature combinations.
  </div>

  {#if title}
    <h4 class="text-center font-medium mb-2 text-gray-900 dark:text-white" id="chart-title">
      {title}
    </h4>
  {:else if data}
    <h4 class="text-center font-medium mb-2 text-gray-900 dark:text-white" id="chart-title">
      {featureLabels.feature1} × {featureLabels.feature2} Interaction
    </h4>
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
          {#each processedData as point, index (`${point.combination}-${dataVersion}`)}
            {@const barDelay = index * 150}
            {@const barHeight = (height - margin.top - margin.bottom) - yScale(point.value)}

            <g>
              <!-- Bar -->
              <rect
                x={xScale(point.combination)}
                y={yScale(point.value)}
                width={xScale.bandwidth()}
                height={barHeight}
                fill={combinationColors[point.colorIndex]}
                class="bar cursor-pointer transition-all duration-200 hover:opacity-80"
                role="button"
                tabindex="0"
                aria-label={generateTooltip(point)}
                onmouseenter={(e) => showTooltip(point, e)}
                onmouseleave={hideTooltip}
                onmousemove={(e) => handleMouseMove(point, e)}
                in:fly|global={{
                  y: 50,
                  duration: 500,
                  delay: barDelay,
                  easing: quintOut
                }}
              />

              <!-- Value labels on top of bars -->
              <text
                x={(xScale(point.combination) || 0) + xScale.bandwidth() / 2}
                y={yScale(point.value) - 8}
                text-anchor="middle"
                font-size="12px"
                font-weight="bold"
                fill={textColor}
                class="value-label pointer-events-none"
                in:fade={{ duration: 300, delay: barDelay + 250 }}
              >
                {formatValue(point.value)}
              </text>

              <!-- Post count labels -->
              <text
                x={(xScale(point.combination) || 0) + xScale.bandwidth() / 2}
                y={height - margin.top - margin.bottom + 35}
                text-anchor="middle"
                font-size="10px"
                fill={textColor}
                opacity="0.7"
                class="count-label pointer-events-none"
                in:fade={{ duration: 300, delay: barDelay + 350 }}
              >
                {point.count.toLocaleString()}
              </text>

              <!-- Percentage labels -->
              <text
                x={(xScale(point.combination) || 0) + xScale.bandwidth() / 2}
                y={height - margin.top - margin.bottom + 50}
                text-anchor="middle"
                font-size="9px"
                fill={textColor}
                opacity="0.6"
                class="percentage-label pointer-events-none"
                in:fade={{ duration: 300, delay: barDelay + 400 }}
              >
                ({point.percentage.toFixed(1)}%)
              </text>
            </g>
          {/each}
        {/if}
      {/key}

      <!-- X axis -->
      <g transform={`translate(0,${height - margin.top - margin.bottom})`} aria-hidden="true">
        {#key dataVersion}
          {#if processedData.length > 0}
            {#each processedData as point, i (point.combination)}
              <text
                x={(xScale(point.combination) || 0) + xScale.bandwidth() / 2}
                y="20"
                text-anchor="middle"
                font-size="11px"
                font-weight="500"
                fill={textColor}
                class="axis-label"
                transition:fade={{ duration: transitionDuration / 2, delay: i * 100 }}
              >
                {formatCombinationLabel(point.combination)}
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
      </g>

      <!-- Y axis -->
      <g aria-hidden="true">
        {#key dataVersion}
          {#each yScale.ticks(5) as tick, i (tick)}
            <g transition:fade={{ duration: transitionDuration / 2, delay: i * 50 }}>
              <line
                x1="0" y1={yScale(tick)}
                x2={width - margin.left - margin.right} y2={yScale(tick)}
                stroke={gridColor}
                stroke-dasharray="3,3"
                opacity="0.5"
              />
              <text
                x="-10" y={yScale(tick)}
                dy=".32em"
                text-anchor="end"
                font-size="11px"
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
          font-size="12px"
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
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
  }

  .axis-label {
    dominant-baseline: hanging;
  }
</style>

<!--
Usage Examples:

1. Basic usage:
<FeatureCombinationChart data={combinationData} />

2. Specific metric:
<FeatureCombinationChart data={combinationData} metric="mean_comments" />

3. Custom title:
<FeatureCombinationChart data={combinationData} title="Images × Questions Analysis" />
-->