<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// ——— Types only (erased at build) ———
	import type { Simulation } from 'd3-force';
	import type { ZoomBehavior, ZoomTransform } from 'd3-zoom';
	import type { Selection } from 'd3-selection';
	import type { NodeT, LinkT } from './types.js';
	import {
		clamp,
		lerp,
		linkFractionForK,
		hash01,
		toGraphCoords,
		rebuildQuadtree
	} from './map2dUtils';
	import { createSubscriberColorScale } from './colorUtils.js';

	let {
		graphData,
		backgroundColor = '#000000'
	}: {
		graphData: { nodes: NodeT[]; links: LinkT[]; metadata: any };
		backgroundColor?: string;
	} = $props();

	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let sim: Simulation<NodeT, LinkT> | null = null;
	let d3zoom: ZoomBehavior<HTMLCanvasElement, unknown> | null = null;
	let d3select: ((node: any) => Selection<any, unknown, null, undefined>) | null = null;
	let zoomIdentity: ZoomTransform;
	let canvasSelection: Selection<HTMLCanvasElement, unknown, null, undefined> | null = null;

	// zoom/pan transform in **device-pixel** space
	let transform = { x: 0, y: 0, k: 1 };

	// hover/drag
	let hoveredNode = $state<NodeT | null>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });
	let draggingNode: NodeT | null = null;
	let lastPointerId: number | null = null;

	// Highlighting state for search
	let highlightedNodeIds = $state<Set<string>>(new Set());
	let focusedNodeId = $state<string | null>(null);
	let connectedNodeIds = $state<Set<string>>(new Set());

	// Double-click detection state
	let clickTimeout = $state<number | null>(null);

	// quadtree for hittest
	let Quadtree: any;
	let qt: any = null;

	// size / DPR
	let width = 0,
		height = 0,
		dpr = 1;
	let resizeObserver: ResizeObserver | undefined;

	let isInitialized = $state(false);
	let error = $state<string | null>(null);

	// Color legend data
	let legendData = $derived.by(() => {
		if (!graphData.nodes.length) return [];

		const subscriberCounts = graphData.nodes
			.map((node) => node.avg_subscriber_count)
			.filter((count) => count != null && count > 0);

		if (subscriberCounts.length === 0) return [];

		const minCount = Math.min(...subscriberCounts);
		const maxCount = Math.max(...subscriberCounts);
		const colorScale = createSubscriberColorScale(graphData.nodes);

		// Create 5 legend items across the range
		const legendItems = [];
		for (let i = 0; i < 5; i++) {
			const value = minCount + (maxCount - minCount) * (i / 4);
			legendItems.push({
				value: Math.round(value),
				color: colorScale(value)
			});
		}

		return legendItems;
	});

	// Render scheduling
	let rafPending = false;
	const scheduleDraw = () => {
		if (rafPending) return;
		rafPending = true;
		requestAnimationFrame(() => {
			rafPending = false;
			draw();
		});
	};

	// links used for rendering (mutated by d3-force to hold node refs)
	let renderLinks: LinkT[] = [];

	// --- Styling / helpers ---
	const nodeRadius = (n: NodeT) => 3 + Math.sqrt(n?.val ?? 1) * 2.2;
	const showLabels = () => transform.k > 1.8;

	// Link style that adapts to zoom
	const LINK = {
		COLOR: '#c6cad3',
		FAR_ALPHA: 0.08,
		NEAR_ALPHA: 0.32,
		BASE_PX: 1.1,
		MAX_PX: 2.0
	};

	// Smooth alpha as we zoom (k ∈ [0.6, 3] ramps)
	function linkAlphaForK(k: number) {
		if (k <= 0.6) return LINK.FAR_ALPHA;
		if (k >= 3) return LINK.NEAR_ALPHA;
		return lerp(LINK.FAR_ALPHA, LINK.NEAR_ALPHA, (k - 0.6) / (3 - 0.6));
	}
	// Line thickness in screen pixels
	function linkWidthPxForK(k: number) {
		return clamp(LINK.BASE_PX + 0.4 * Math.log2(k + 1), LINK.BASE_PX, LINK.MAX_PX);
	}

	function handleMouseMove(ev: MouseEvent) {
		tooltipPosition = { x: ev.clientX, y: ev.clientY };
		const p = toGraphCoords(ev, canvasEl, transform, dpr);
		updateHover(p.x, p.y);
	}

	function updateHover(x: number, y: number) {
		if (!graphData.nodes) return;

		let closestNode: NodeT | null = null;
		let closestDistance = Infinity;

		// Check all nodes to find the one we're hovering over
		for (const node of graphData.nodes) {
			if (node.x == null || node.y == null) continue;

			const dx = node.x - x;
			const dy = node.y - y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const nodeR = nodeRadius(node);

			// If we're inside this node and it's closer than any previous match
			if (distance <= nodeR && distance < closestDistance) {
				closestNode = node;
				closestDistance = distance;
			}
		}

		hoveredNode = closestNode;
	}

	function draw() {
		if (!ctx) return;

		// clear + background
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width * dpr, height * dpr);
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width * dpr, height * dpr);

		// apply zoom transform
		ctx.setTransform(transform.k, 0, 0, transform.k, transform.x, transform.y);

		// ------ LINKS (LOD + subtle) ------
		const k = transform.k;
		const frac = linkFractionForK(k);
		const alpha = linkAlphaForK(k);
		const strokePx = linkWidthPxForK(k);

		if (frac > 0 && renderLinks.length) {
			const hasHighlight = highlightedNodeIds.size > 0;

			ctx.beginPath();
			let drawn = 0;
			const maxPerFrame = 20000;
			for (let i = 0; i < renderLinks.length; i++) {
				const l = renderLinks[i] as any;
				const s = l.source as NodeT,
					t = l.target as NodeT;
				if (!s || !t || s.x == null || t.x == null) continue;

				// Check if this link connects highlighted nodes
				const sourceId = typeof l.source === 'object' ? (l.source as NodeT).id : l.source;
				const targetId = typeof l.target === 'object' ? (l.target as NodeT).id : l.target;
				const isHighlightedLink =
					hasHighlight && highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId);

				// stable sampling
				if (l._r == null) {
					const sid = typeof l.source === 'object' ? (l.source as NodeT).id : l.source;
					const tid = typeof l.target === 'object' ? (l.target as NodeT).id : l.target;
					l._r = hash01(String(sid) + '|' + String(tid));
				}
				// Skip sampling for highlighted links, otherwise apply normal sampling
				if (!isHighlightedLink && l._r > frac) continue;

				// when far out, skip trimming (cheaper)
				if (k < 1.5) {
					ctx.moveTo(s.x!, s.y!);
					ctx.lineTo(t.x!, t.y!);
				} else {
					// trim to node edges (nicer when zoomed in)
					const dx = t.x! - s.x!;
					const dy = t.y! - s.y!;
					const len = Math.hypot(dx, dy);
					if (!len || !isFinite(len)) continue;
					const rs = nodeRadius(s);
					const rt = nodeRadius(t);
					if (len <= rs + rt) continue;
					const ux = dx / len,
						uy = dy / len;
					const x1 = s.x! + ux * rs,
						y1 = s.y! + uy * rs;
					const x2 = t.x! - ux * rt,
						y2 = t.y! - uy * rt;
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
				}

				if (++drawn >= maxPerFrame) break;
			}
			ctx.globalAlpha = alpha;
			ctx.lineWidth = strokePx / k;
			ctx.strokeStyle = LINK.COLOR;
			ctx.stroke();

			// Draw highlighted links with glow
			if (hasHighlight) {
				ctx.beginPath();
				for (let i = 0; i < renderLinks.length; i++) {
					const l = renderLinks[i] as any;
					const s = l.source as NodeT,
						t = l.target as NodeT;
					if (!s || !t || s.x == null || t.x == null) continue;

					const sourceId = typeof l.source === 'object' ? (l.source as NodeT).id : l.source;
					const targetId = typeof l.target === 'object' ? (l.target as NodeT).id : l.target;
					const isHighlightedLink =
						highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId);

					if (!isHighlightedLink) continue;

					const dx = t.x! - s.x!;
					const dy = t.y! - s.y!;
					const len = Math.hypot(dx, dy);
					if (!len || !isFinite(len)) continue;
					const rs = nodeRadius(s);
					const rt = nodeRadius(t);
					if (len <= rs + rt) continue;
					const ux = dx / len,
						uy = dy / len;
					const x1 = s.x! + ux * rs,
						y1 = s.y! + uy * rs;
					const x2 = t.x! - ux * rt,
						y2 = t.y! - uy * rt;
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
				}
				ctx.globalAlpha = 0.9;
				ctx.lineWidth = (strokePx + 1.5) / k;
				ctx.strokeStyle = '#a855f7';
				ctx.stroke();
			}

			ctx.globalAlpha = 1;
		}

		// ------ NODES ------
		const hasHighlight = highlightedNodeIds.size > 0;

		for (const n of graphData.nodes) {
			const r = nodeRadius(n);
			const isHighlighted = highlightedNodeIds.has(n.id);
			const isFocused = n.id === focusedNodeId;

			// Apply opacity for non-highlighted nodes when highlighting is active
			if (hasHighlight && !isHighlighted) {
				ctx.globalAlpha = 0.12;
			} else {
				ctx.globalAlpha = 1;
			}

			// Draw node
			ctx.beginPath();
			ctx.arc(n.x!, n.y!, r, 0, Math.PI * 2);
			ctx.fillStyle = n.color ?? '#ccc';
			ctx.fill();

			// Add glow effect for focused node
			if (isFocused) {
				ctx.globalAlpha = 0.7;
				ctx.beginPath();
				ctx.arc(n.x!, n.y!, r + 8 / transform.k, 0, Math.PI * 2);
				ctx.strokeStyle = '#a855f7';
				ctx.lineWidth = 4 / transform.k;
				ctx.stroke();
				ctx.globalAlpha = 0.4;
				ctx.beginPath();
				ctx.arc(n.x!, n.y!, r + 14 / transform.k, 0, Math.PI * 2);
				ctx.strokeStyle = '#a855f7';
				ctx.lineWidth = 3 / transform.k;
				ctx.stroke();
			}

			ctx.globalAlpha = 1;
		}

		// ------ LABELS ------
		if (showLabels()) {
			ctx.font = `${14 / transform.k}px Sans-Serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 3 / transform.k;
			for (const n of graphData.nodes) {
				const r = nodeRadius(n);
				const label = n.label ?? n.name ?? n.id;
				if (!label) continue;
				const lines = label.split('\n');
				for (let i = 0; i < lines.length; i++) {
					const y = n.y! + r + (4 + i * 16) / transform.k;
					ctx.strokeText(lines[i], n.x!, y);
					ctx.fillText(lines[i], n.x!, y);
				}
			}
		}

		// ------ HOVER RING ------
		if (hoveredNode) {
			const r = nodeRadius(hoveredNode);
			ctx.beginPath();
			ctx.arc(hoveredNode.x!, hoveredNode.y!, r + 4 / transform.k, 0, Math.PI * 2);
			ctx.lineWidth = 3 / transform.k;
			ctx.strokeStyle = 'rgba(255,255,255,0.9)';
			ctx.stroke();
		}
	}

	function focusNode(
		n: NodeT,
		duration = 800,
		targetK = Math.min(6, Math.max(2.5, transform.k * 1.4))
	) {
		if (!n || !d3zoom) return;
		const cx = (width * dpr) / 2,
			cy = (height * dpr) / 2;
		const tx = cx - n.x! * targetK;
		const ty = cy - n.y! * targetK;
		animateTransform({ k: targetK, x: tx, y: ty }, duration);
	}

	// Public methods for search integration
	export function highlightNodes(nodeIds: string[]) {
		highlightedNodeIds = new Set(nodeIds);
		scheduleDraw();
	}

	export function highlightNode(nodeId: string) {
		focusedNodeId = nodeId;
		// Find connected nodes
		const connected = new Set<string>();
		for (const link of renderLinks) {
			const sourceId =
				typeof link.source === 'object' ? (link.source as NodeT).id : (link.source as string);
			const targetId =
				typeof link.target === 'object' ? (link.target as NodeT).id : (link.target as string);
			if (sourceId === nodeId) connected.add(targetId);
			if (targetId === nodeId) connected.add(sourceId);
		}
		connectedNodeIds = connected;
		highlightedNodeIds = new Set([nodeId, ...connected]);
		scheduleDraw();
	}

	// Expand the highlight network to include a node's connections
	function expandHighlightNetwork(nodeId: string) {
		// Find new connections for this node
		const newConnections = new Set<string>();
		for (const link of renderLinks) {
			const sourceId =
				typeof link.source === 'object' ? (link.source as NodeT).id : (link.source as string);
			const targetId =
				typeof link.target === 'object' ? (link.target as NodeT).id : (link.target as string);
			if (sourceId === nodeId) newConnections.add(targetId);
			if (targetId === nodeId) newConnections.add(sourceId);
		}

		// Add the clicked node's connections to the highlight set
		for (const connectedId of newConnections) {
			highlightedNodeIds.add(connectedId);
			connectedNodeIds.add(connectedId);
		}

		// Update the focused node
		focusedNodeId = nodeId;
		scheduleDraw();
	}

	export function clearHighlight() {
		highlightedNodeIds.clear();
		focusedNodeId = null;
		connectedNodeIds.clear();
		scheduleDraw();
	}

	export { focusNode };

	function handleSingleClick(node: NodeT | null) {
		if (!node) return;

		// Existing single-click logic
		if (highlightedNodeIds.has(node.id)) {
			expandHighlightNetwork(node.id);
		} else {
			highlightNode(node.id);
		}
		focusNode(node, 800);
	}

	function animateTransform(end: { k: number; x: number; y: number }, duration = 600) {
		const start = { ...transform };
		const t0 = performance.now();
		const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

		function step(now: number) {
			const u = Math.min(1, (now - t0) / duration);
			const e = ease(u);
			transform = {
				k: start.k + (end.k - start.k) * e,
				x: start.x + (end.x - start.x) * e,
				y: start.y + (end.y - start.y) * e
			};
			scheduleDraw();
			if (u < 1) requestAnimationFrame(step);
			else {
				if (d3select && d3zoom) {
					d3select(canvasEl).call(
						d3zoom.transform as any,
						zoomIdentity.translate(end.x / dpr, end.y / dpr).scale(end.k)
					);
				}
			}
		}
		requestAnimationFrame(step);
	}

	function zoomToFit(padding = 80, duration = 600) {
		const nodes = graphData.nodes;
		if (!nodes.length) return;

		const xs = nodes.map((n) => n.x ?? 0);
		const ys = nodes.map((n) => n.y ?? 0);
		let minX = Math.min(...xs),
			maxX = Math.max(...xs);
		let minY = Math.min(...ys),
			maxY = Math.max(...ys);
		if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return;

		const dx = Math.max(1, maxX - minX);
		const dy = Math.max(1, maxY - minY);

		const k = Math.max(
			0.005,
			Math.min(
				32,
				0.9 * Math.min((width * dpr) / (dx + padding * 2), (height * dpr) / (dy + padding * 2))
			)
		);
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;
		const tx = (width * dpr) / 2 - cx * k;
		const ty = (height * dpr) / 2 - cy * k;

		animateTransform({ k, x: tx, y: ty }, duration);
	}

	const handleClick = (ev: MouseEvent) => {
		const p = toGraphCoords(ev, canvasEl, transform, dpr);
		updateHover(p.x, p.y);

		// If clicking outside any node, clear highlight
		if (!hoveredNode) {
			clearHighlight();
			return;
		}

		const currentNode = hoveredNode;

		// If clicking on the same focused node, deselect it
		if (focusedNodeId === currentNode.id) {
			clearHighlight();
			return;
		}

		// If clicking on a node that's already highlighted (but not focused), expand the network
		if (highlightedNodeIds.has(currentNode.id)) {
			expandHighlightNetwork(currentNode.id);
			focusNode(currentNode, 800);
			return;
		}

		// Single click for topics (no double-click needed)
		handleSingleClick(currentNode);
	};

	function onPointerDown(ev: PointerEvent) {
		const p = toGraphCoords(ev, canvasEl, transform, dpr);
		updateHover(p.x, p.y);
		if (!hoveredNode) return;
		draggingNode = hoveredNode;
		canvasEl.setPointerCapture(ev.pointerId);
		lastPointerId = ev.pointerId;
		draggingNode.fx = p.x;
		draggingNode.fy = p.y;
		sim?.alphaTarget(0.3).restart();
		ev.preventDefault();
	}
	function onPointerMove(ev: PointerEvent) {
		if (!draggingNode) return;
		const p = toGraphCoords(ev, canvasEl, transform, dpr);
		draggingNode.fx = p.x;
		draggingNode.fy = p.y;
		scheduleDraw();
	}
	function onPointerUp() {
		if (!draggingNode) return;
		draggingNode.fx = null;
		draggingNode.fy = null;
		draggingNode = null;
		if (lastPointerId != null) {
			try {
				canvasEl.releasePointerCapture(lastPointerId);
			} catch {}
			lastPointerId = null;
		}
		sim?.alphaTarget(0);
	}

	function setupCanvasSize() {
		const rect = containerEl.getBoundingClientRect();
		width = Math.max(1, Math.floor(rect.width));
		height = Math.max(1, Math.floor(rect.height));
		dpr = Math.min(2, window.devicePixelRatio || 1);
		canvasEl.width = Math.round(width * dpr);
		canvasEl.height = Math.round(height * dpr);
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		scheduleDraw();
	}

	// ——— Dynamic import cache (per module) ———
	let d3ModulesP: Promise<
		[
			typeof import('d3-force'),
			typeof import('d3-zoom'),
			typeof import('d3-selection'),
			typeof import('d3-quadtree')
		]
	> | null = null;
	function loadD3() {
		d3ModulesP ??= Promise.all([
			import('d3-force'),
			import('d3-zoom'),
			import('d3-selection'),
			import('d3-quadtree')
		]);
		return d3ModulesP;
	}

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key.toLowerCase() === 'f') zoomToFit(80, 500);
	};

	onMount(async () => {
		if (!browser) return;

		try {
			const [force, zoomMod, selectionMod, Q] = await loadD3();

			Quadtree = Q;
			d3select = selectionMod.select;
			const zoom = zoomMod.zoom;
			zoomIdentity = zoomMod.zoomIdentity;

			ctx = canvasEl.getContext('2d', { alpha: false });
			if (!ctx) throw new Error('Canvas 2D context not available');

			setupCanvasSize();
			resizeObserver = new ResizeObserver(setupCanvasSize);
			resizeObserver.observe(containerEl);

			d3zoom = zoom<HTMLCanvasElement, unknown>()
				.scaleExtent([0.005, 32])
				.filter((event: any) => !draggingNode || event.type === 'wheel')
				.on('zoom', (event: any) => {
					transform = {
						k: event.transform.k,
						x: event.transform.x * dpr,
						y: event.transform.y * dpr
					};
					scheduleDraw();
				});

			if (d3select) {
				canvasSelection = d3select(canvasEl);
				canvasSelection.call(d3zoom as any);
			}

			// pointer/hover/click
			canvasEl.addEventListener('pointerdown', onPointerDown);
			canvasEl.addEventListener('pointermove', onPointerMove);
			canvasEl.addEventListener('pointerup', onPointerUp);
			canvasEl.addEventListener('mousemove', handleMouseMove);
			canvasEl.addEventListener('click', handleClick);

			// keyboard: press "f" to zoom-to-fit
			window.addEventListener('keydown', onKeyDown);

			// d3-force (2D)
			const nodes = graphData.nodes;
			const links = graphData.links.map((l) => ({ ...l })); // shallow copy
			renderLinks = links; // render the same (mutated) array

			// give each link a stable sampling key once
			for (const l of links) {
				const sid = typeof l.source === 'object' ? (l.source as NodeT).id : (l.source as string);
				const tid = typeof l.target === 'object' ? (l.target as NodeT).id : (l.target as string);
				l._r = hash01(String(sid) + '|' + String(tid));
			}

			sim = force
				.forceSimulation(nodes)
				.force(
					'link',
					force
						.forceLink<NodeT, LinkT>(links)
						.id((d: any) => d.id)
						.distance((l: any) => {
							const sv = (typeof l.source === 'object' ? (l.source as NodeT).val : 1) ?? 1;
							const tv = (typeof l.target === 'object' ? (l.target as NodeT).val : 1) ?? 1;
							return 100 + 50 * Math.sqrt(Math.min(sv, tv));
						})
						.strength(0.8)
				)
				.force('charge', force.forceManyBody().strength(-180))
				.force(
					'collide',
					force.forceCollide<NodeT>((n) => nodeRadius(n) + 5)
				)
				.force('center', force.forceCenter(0, 0))
				.alphaDecay(0.02)
				.velocityDecay(0.3)
				.on('tick', () => {
					qt = rebuildQuadtree(Quadtree, graphData.nodes);
					scheduleDraw();
				});

			isInitialized = true;

			setTimeout(() => zoomToFit(80, 500), 350);
		} catch (e: any) {
			error = e?.message ?? 'Failed to initialize topic galaxy';
		}
	});

	// Cleanup effect for click timeout
	$effect(() => {
		return () => {
			if (clickTimeout) {
				clearTimeout(clickTimeout);
				clickTimeout = null;
			}
		};
	});

	$effect(() => {
		return () => {
			try {
				sim?.stop?.();
				resizeObserver?.disconnect?.();

				canvasEl?.removeEventListener?.('pointerdown', onPointerDown);
				canvasEl?.removeEventListener?.('pointermove', onPointerMove);
				canvasEl?.removeEventListener?.('pointerup', onPointerUp);
				canvasEl?.removeEventListener?.('mousemove', handleMouseMove);
				canvasEl?.removeEventListener?.('click', handleClick);

				window?.removeEventListener?.('keydown', onKeyDown);

				canvasSelection?.on?.('.zoom', null);

				if (lastPointerId != null) {
					try {
						canvasEl.releasePointerCapture(lastPointerId);
					} catch {}
					lastPointerId = null;
				}
			} catch {}
			sim = null;
		};
	});

	$effect(() => {
		if (isInitialized) scheduleDraw();
	});
</script>

<div class="relative h-full w-full" bind:this={containerEl}>
	<canvas bind:this={canvasEl} class="block h-full w-full"></canvas>

	{#if error}
		<div class="absolute inset-0 grid place-items-center">
			<div class="rounded-lg preset-filled-error-800-200 p-6">
				<h3 class="h3">Graph Error</h3>
				<p>{error}</p>
			</div>
		</div>
	{:else if !browser || !isInitialized}
		<div class="absolute inset-0 grid place-items-center">
			<div class="rounded-lg preset-filled-surface-100-900 p-6">
				<h3 class="h3">Loading Topic Galaxy…</h3>
				<p class="mt-2">Mapping topic relationships across the Substack universe</p>
			</div>
		</div>
	{:else}
		<!-- Color Legend -->
		{#if legendData.length > 0}
			<div class="absolute top-4 left-4 z-30">
				<div
					class="preset-filled-surface-100-900/90 rounded-lg border border-surface-300/20 p-3 backdrop-blur-sm"
				>
					<h4 class="mb-2 text-xs font-semibold text-surface-700-300">Average Subscribers</h4>
					<div class="space-y-1">
						{#each legendData as item}
							<div class="flex items-center gap-2">
								<div
									class="h-3 w-3 rounded-full border border-surface-400/30"
									style="background-color: {item.color}"
								></div>
								<span class="font-mono text-xs text-surface-600-400">
									{item.value.toLocaleString()}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Controls -->
		<div class="absolute top-4 right-4 z-30">
			<div
				class="preset-filled-surface-100-900/90 rounded-lg border border-surface-300/20 p-3 backdrop-blur-sm"
			>
				<p class="text-sm text-surface-700-300">
					Press <kbd class="rounded border bg-surface-200-800 px-1 py-0.5 text-xs">F</kbd> to fit • Click
					topics to explore connections
				</p>
			</div>
		</div>
	{/if}

	{#if hoveredNode}
		<div
			class="pointer-events-none fixed z-[9999]"
			style="left: {tooltipPosition.x + 15}px; top: {tooltipPosition.y - 10}px;"
		>
			<div
				class="min-w-72 card border border-surface-400 preset-filled-surface-100-900 p-4 shadow-xl"
			>
				<header class="card-header pb-2">
					<h4 class="text-on-surface h4 font-semibold">{hoveredNode.name}</h4>
				</header>
				<section class="card-body space-y-3">
					<div class="flex items-center justify-between gap-4">
						<span class="text-sm opacity-75">Category:</span>
						<span class="text-right text-sm font-medium">{hoveredNode.category}</span>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-sm opacity-75">Type:</span>
						<span class="text-right text-sm font-medium">
							{hoveredNode.topic_type === 'macro' ? 'Macro Topic' : 'Micro Topic'}
						</span>
					</div>
					{#if hoveredNode.subscriber_count && hoveredNode.subscriber_count > 0}
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm opacity-75">Total Subscribers:</span>
							<span class="text-right text-sm font-medium">
								{hoveredNode.subscriber_count.toLocaleString()}
							</span>
						</div>
					{/if}
					{#if hoveredNode.avg_subscriber_count && hoveredNode.avg_subscriber_count > 0}
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm opacity-75">Avg Subscribers:</span>
							<span class="text-right text-sm font-medium">
								{hoveredNode.avg_subscriber_count.toLocaleString()}
							</span>
						</div>
					{/if}
					{#if hoveredNode.macro_topic}
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm opacity-75">Parent Topic:</span>
							<span class="text-right text-sm font-medium">{hoveredNode.macro_topic}</span>
						</div>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>
