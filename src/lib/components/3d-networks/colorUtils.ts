import { scaleLinear } from 'd3-scale';
import { interpolateOranges } from 'd3-scale-chromatic';

/**
 * Creates a D3 linear scale using interpolateOranges for avg_subscriber_count values
 * @param nodes Array of nodes with avg_subscriber_count property
 * @returns A color scale function that maps avg_subscriber_count to orange colors
 */
export function createSubscriberColorScale(nodes: any[]) {
	// Extract avg_subscriber_count values, filtering out null/undefined
	const subscriberCounts = nodes
		.map(node => node.avg_subscriber_count)
		.filter(count => count != null && count > 0);
	
	if (subscriberCounts.length === 0) {
		// Fallback if no valid subscriber counts
		return () => '#ff7f00'; // Default orange
	}
	
	const minCount = Math.min(...subscriberCounts);
	const maxCount = Math.max(...subscriberCounts);
	
	// Create linear scale mapping subscriber count to [0, 1] range for interpolateOranges
	const colorScale = scaleLinear<string>()
		.domain([minCount, maxCount])
		.range([0, 1] as any)
		.interpolate(() => (t: number) => interpolateOranges(t));
	
	return (subscriberCount: number) => {
		if (subscriberCount == null || subscriberCount <= 0) {
			return '#ff7f00'; // Default orange for missing data
		}
		return colorScale(subscriberCount);
	};
}

/**
 * Creates a generic D3 linear scale using interpolateOranges for any numeric metric
 * @param nodes Array of nodes
 * @param metricKey The property key to use for coloring
 * @returns A color scale function that maps the metric to orange colors
 */
export function createGenericColorScale(nodes: any[], metricKey: string) {
	// Extract metric values, filtering out null/undefined/zero
	const metricValues = nodes
		.map(node => node[metricKey])
		.filter(value => value != null && value > 0);
	
	if (metricValues.length === 0) {
		// Fallback if no valid values
		return () => '#ff7f00'; // Default orange
	}
	
	const minValue = Math.min(...metricValues);
	const maxValue = Math.max(...metricValues);
	
	// Create linear scale mapping metric to [0, 1] range for interpolateOranges
	const colorScale = scaleLinear<string>()
		.domain([minValue, maxValue])
		.range([0, 1] as any)
		.interpolate(() => (t: number) => interpolateOranges(t));
	
	return (value: number) => {
		if (value == null || value <= 0) {
			return '#ff7f00'; // Default orange for missing data
		}
		return colorScale(value);
	};
}

/**
 * Applies the subscriber color scale to nodes
 * @param nodes Array of nodes to color
 * @returns Array of nodes with color property added based on avg_subscriber_count
 */
export function applySubscriberColors(nodes: any[]) {
	const colorScale = createSubscriberColorScale(nodes);
	
	return nodes.map(node => ({
		...node,
		color: colorScale(node.avg_subscriber_count)
	}));
}

/**
 * Applies a generic color scale to nodes based on any metric
 * @param nodes Array of nodes to color
 * @param metricKey The property key to use for coloring
 * @returns Array of nodes with color property added based on the specified metric
 */
export function applyGenericColors(nodes: any[], metricKey: string) {
	const colorScale = createGenericColorScale(nodes, metricKey);
	
	return nodes.map(node => ({
		...node,
		color: colorScale(node[metricKey])
	}));
}