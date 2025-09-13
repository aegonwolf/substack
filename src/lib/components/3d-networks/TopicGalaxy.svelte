<script lang="ts">

	import TopicMap2d from './TopicMap2d.svelte';
	import type { NodeT, LinkT } from './types.js';
	import { applySubscriberColors } from './colorUtils.js';

	let {
		topicData,
		backgroundColor = '#0a0a0a'
	}: {
		topicData: any;
		backgroundColor?: string;
	} = $props();

	let map2dRef: TopicMap2d;
	// Transform topic data to match map2d expected format
	function transformTopicData(data: any) {
		const nodes: NodeT[] = data.nodes.map((topic: any) => {
			// All nodes are now topics with consistent structure
			const name = topic.label || topic.id;

			return {
				id: topic.id,
				name: name,
				label: topic.label,
				val: Math.max(1, topic.val), // Use val as-is for node size
				x: Math.random() * 1000 - 500, // Random initial positions
				y: Math.random() * 1000 - 500,
				// Add topic-specific properties for tooltip
				category: 'Topic',
				subscriber_count: topic.subscriber_sum || 0,
				is_bestseller: false,
				// Additional properties for knowledge graph
				topic_type: topic.type,
				// Include avg_subscriber_count for color scaling
				avg_subscriber_count: topic.avg_subscriber_count,
				// Include publication and post counts
				pub_count: topic.pub_count || 0,
				post_count: topic.post_count || 0
			};
		});

		// Apply D3 interpolate oranges color scale based on avg_subscriber_count
		const coloredNodes = applySubscriberColors(nodes);

		const links: LinkT[] = data.links.map((link: any) => ({
			source: link.source,
			target: link.target
		}));

		return {
			nodes: coloredNodes,
			links,
			metadata: {
				...data.metadata,
				type: 'topic_galaxy'
			}
		};
	}

	let graphData = $derived(topicData ? transformTopicData(topicData) : { nodes: [], links: [], metadata: {} });

	// Public methods to expose map2d functionality
	export function highlightNodes(nodeIds: string[]) {
		map2dRef?.highlightNodes(nodeIds);
	}

	export function highlightNode(nodeId: string) {
		map2dRef?.highlightNode(nodeId);
	}

	export function clearHighlight() {
		map2dRef?.clearHighlight();
	}

	export function focusNode(nodeId: string) {
		const node = graphData.nodes.find((n) => n.id === nodeId);
		if (node) {
			map2dRef?.focusNode(node);
		}
	}


</script>

<div class="h-full w-full">
	<TopicMap2d bind:this={map2dRef} {graphData} {backgroundColor} />
</div>
