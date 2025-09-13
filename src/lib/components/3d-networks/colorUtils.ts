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