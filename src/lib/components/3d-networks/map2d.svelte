<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let {
		graphData,
		backgroundColor = '#000000'
	}: {
		graphData: { nodes: any[]; links: any[]; metadata: any };
		backgroundColor?: string;
	} = $props();

	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let sim: any = null;
	let d3zoom: any;
	let d3select: any;
	let zoomIdentity: any;

	// zoom/pan transform in **device-pixel** space
	let transform = { x: 0, y: 0, k: 1 };

	// hover/drag
	let hoveredNode = $state<any>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });
	let draggingNode: any = null;
	
	// Highlighting state for search
	let highlightedNodeIds = $state<Set<string>>(new Set());
	let focusedNodeId = $state<string | null>(null);
	let connectedNodeIds = $state<Set<string>>(new Set());

	// quadtree for hittest
	let Quadtree: any;
	let qt: any = null;

	// size / DPR
	let width = 0, height = 0, dpr = 1;
	let resizeObserver: ResizeObserver;
	
	// Starfield effect
	let stars: Array<{x: number, y: number, size: number, brightness: number}> = [];

	let isInitialized = $state(false);
	let error = $state<string | null>(null);

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
	let renderLinks: any[] = [];

	// --- Styling / helpers ---
	const nodeRadius = (n: any) => 2 + Math.sqrt(n?.val ?? 1) * 1.6;
	const showLabels = () => transform.k > 1.5;

	// Link style that adapts to zoom
	const LINK = {
		COLOR: '#c6cad3',
		FAR_ALPHA: 0.06,     // very faint when zoomed out
		NEAR_ALPHA: 0.28,    // still subtle when zoomed in
		BASE_PX: 0.9,
		MAX_PX: 1.6
	};
	const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	// Smooth alpha as we zoom (k ∈ [0.6, 3] ramps)
	function linkAlphaForK(k: number) {
		if (k <= 0.6) return LINK.FAR_ALPHA;
		if (k >= 3)   return LINK.NEAR_ALPHA;
		return lerp(LINK.FAR_ALPHA, LINK.NEAR_ALPHA, (k - 0.6) / (3 - 0.6));
	}
	// Line thickness in screen pixels
	function linkWidthPxForK(k: number) {
		return clamp(LINK.BASE_PX + 0.35 * Math.log2(k + 1), LINK.BASE_PX, LINK.MAX_PX);
	}

	// Level-of-detail: fraction of links to draw at a given zoom
	// (0 when far out, 100% when zoomed in)
	function linkFractionForK(k: number) {
		if (k < 0.5) return 0.0;
		if (k < 1.0) return 0.12;
		if (k < 2.0) return 0.28;
		if (k < 3.0) return 0.6;
		return 1.0;
	}

	// Deterministic per-link random in [0,1) so sampling is stable
	function hash01(str: string) {
		let h = 2166136261 >>> 0;
		for (let i = 0; i < str.length; i++) {
			h ^= str.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		// xorshift
		h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995);
		h ^= h >>> 15;
		return (h >>> 0) / 4294967296;
	}

	function handleMouseMove(ev: MouseEvent) {
		tooltipPosition = { x: ev.clientX, y: ev.clientY };
		const p = toGraphCoords(ev);
		updateHover(p.x, p.y);
	}

	function toGraphCoords(ev: MouseEvent | PointerEvent) {
		const rect = canvasEl.getBoundingClientRect();
		const sx = ev.clientX - rect.left;
		const sy = ev.clientY - rect.top;
		return {
			x: (sx * dpr - transform.x) / transform.k,
			y: (sy * dpr - transform.y) / transform.k
		};
	}

	function rebuildQuadtree() {
		if (!Quadtree) return;
		qt = Quadtree.quadtree(
			graphData.nodes,
			(d: any) => d.x,
			(d: any) => d.y
		);
	}

	function updateHover(x: number, y: number) {
		if (!qt) return;
		const searchR = 12 / Math.max(0.1, transform.k);
		const cand = qt.find(x, y, searchR);
		if (cand) {
			const r = nodeRadius(cand);
			const dx = cand.x - x, dy = cand.y - y;
			hoveredNode = dx * dx + dy * dy <= r * r ? cand : null;
		} else hoveredNode = null;
	}

	function draw() {
		if (!ctx) return;

		// clear + background
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width * dpr, height * dpr);
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width * dpr, height * dpr);
		
		// Draw starfield
		for (const star of stars) {
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.6})`;
			ctx.fill();
		}

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
			const maxPerFrame = 20000; // hard cap for perf
			for (let i = 0; i < renderLinks.length; i++) {
				const l: any = renderLinks[i];
				const s: any = l.source, t: any = l.target;
				if (!s || !t || s.x == null || t.x == null) continue;

				// Check if this link connects highlighted nodes
				const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
				const targetId = typeof l.target === 'object' ? l.target.id : l.target;
				const isHighlightedLink = hasHighlight && 
					(highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

				// stable sampling
				if (l._r == null) {
					const sid = typeof l.source === 'object' ? l.source.id : l.source;
					const tid = typeof l.target === 'object' ? l.target.id : l.target;
					l._r = hash01(String(sid) + '|' + String(tid));
				}
				// Skip sampling for highlighted links, otherwise apply normal sampling
				if (!isHighlightedLink && l._r > frac) continue;

				// when far out, skip trimming (cheaper)
				if (k < 1.5) {
					ctx.moveTo(s.x, s.y);
					ctx.lineTo(t.x, t.y);
				} else {
					// trim to node edges (nicer when zoomed in)
					const dx = t.x - s.x, dy = t.y - s.y;
					const len = Math.hypot(dx, dy);
					if (!len || !isFinite(len)) continue;
					const rs = nodeRadius(s);
					const rt = nodeRadius(t);
					if (len <= rs + rt) continue;
					const ux = dx / len, uy = dy / len;
					const x1 = s.x + ux * rs, y1 = s.y + uy * rs;
					const x2 = t.x - ux * rt, y2 = t.y - uy * rt;
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
				}

				if (++drawn >= maxPerFrame) break;
			}
			ctx.globalAlpha = alpha;
			ctx.lineWidth = strokePx / k; // constant in screen px
			ctx.strokeStyle = LINK.COLOR;
			ctx.stroke();
			
			// Draw highlighted links with glow
			if (hasHighlight) {
				ctx.beginPath();
				for (let i = 0; i < renderLinks.length; i++) {
					const l: any = renderLinks[i];
					const s: any = l.source, t: any = l.target;
					if (!s || !t || s.x == null || t.x == null) continue;
					
					const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
					const targetId = typeof l.target === 'object' ? l.target.id : l.target;
					const isHighlightedLink = highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId);
					
					if (!isHighlightedLink) continue;
					
					// Draw with trimming for clean connections
					const dx = t.x - s.x, dy = t.y - s.y;
					const len = Math.hypot(dx, dy);
					if (!len || !isFinite(len)) continue;
					const rs = nodeRadius(s);
					const rt = nodeRadius(t);
					if (len <= rs + rt) continue;
					const ux = dx / len, uy = dy / len;
					const x1 = s.x + ux * rs, y1 = s.y + uy * rs;
					const x2 = t.x - ux * rt, y2 = t.y - uy * rt;
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
				}
				ctx.globalAlpha = 0.8;
				ctx.lineWidth = (strokePx + 1) / k;
				ctx.strokeStyle = '#9333ea';
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
				ctx.globalAlpha = 0.15;
			} else {
				ctx.globalAlpha = 1;
			}
			
			// Draw node
			ctx.beginPath();
			ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
			ctx.fillStyle = n.color ?? '#ccc';
			ctx.fill();
			
			// Add glow effect for focused node
			if (isFocused) {
				ctx.globalAlpha = 0.6;
				ctx.beginPath();
				ctx.arc(n.x, n.y, r + 6 / transform.k, 0, Math.PI * 2);
				ctx.strokeStyle = '#9333ea';
				ctx.lineWidth = 3 / transform.k;
				ctx.stroke();
				ctx.globalAlpha = 0.3;
				ctx.beginPath();
				ctx.arc(n.x, n.y, r + 10 / transform.k, 0, Math.PI * 2);
				ctx.strokeStyle = '#9333ea';
				ctx.lineWidth = 2 / transform.k;
				ctx.stroke();
			}
			
			ctx.globalAlpha = 1;
		}

		// ------ LABELS ------
		if (showLabels()) {
			ctx.font = `${12 / transform.k}px Sans-Serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillStyle = '#fff';
			for (const n of graphData.nodes) {
				const r = nodeRadius(n);
				const label = n.label ?? n.name ?? n.id;
				if (!label) continue;
				ctx.fillText(label, n.x, n.y + r + 2 / transform.k);
			}
		}

		// ------ HOVER RING ------
		if (hoveredNode) {
			const r = nodeRadius(hoveredNode);
			ctx.beginPath();
			ctx.arc(hoveredNode.x, hoveredNode.y, r + 3 / transform.k, 0, Math.PI * 2);
			ctx.lineWidth = 2 / transform.k;
			ctx.strokeStyle = 'rgba(255,255,255,0.9)';
			ctx.stroke();
		}
	}

	function focusNode(n: any, duration = 800, targetK = Math.min(8, Math.max(2, transform.k * 1.3))) {
		if (!n || !d3zoom) return;
		const cx = (width * dpr) / 2, cy = (height * dpr) / 2;
		const tx = cx - n.x * targetK;
		const ty = cy - n.y * targetK;
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
			const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
			const targetId = typeof link.target === 'object' ? link.target.id : link.target;
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
			const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
			const targetId = typeof link.target === 'object' ? link.target.id : link.target;
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

	function animateTransform(end: {k:number;x:number;y:number}, duration=600) {
		const start = { ...transform };
		const t0 = performance.now();
		const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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
				d3select(canvasEl).call(
					d3zoom.transform,
					zoomIdentity.translate(end.x / dpr, end.y / dpr).scale(end.k)
				);
			}
		}
		requestAnimationFrame(step);
	}

	function zoomToFit(padding = 60, duration = 600) {
		const nodes = graphData.nodes;
		if (!nodes.length) return;

		const xs = nodes.map((n: any) => n.x ?? 0);
		const ys = nodes.map((n: any) => n.y ?? 0);
		let minX = Math.min(...xs), maxX = Math.max(...xs);
		let minY = Math.min(...ys), maxY = Math.max(...ys);
		if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return;

		const dx = Math.max(1, maxX - minX);
		const dy = Math.max(1, maxY - minY);

		const k = Math.max(0.005, Math.min(64,
			0.95 * Math.min((width * dpr) / (dx + padding * 2), (height * dpr) / (dy + padding * 2))
		));
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;
		const tx = (width * dpr) / 2 - cx * k;
		const ty = (height * dpr) / 2 - cy * k;

		animateTransform({ k, x: tx, y: ty }, duration);
	}

	const handleClick = (ev: MouseEvent) => {
		const p = toGraphCoords(ev);
		updateHover(p.x, p.y);
		if (hoveredNode) {
			// Check if the clicked node is already part of the highlighted network
			if (highlightedNodeIds.has(hoveredNode.id)) {
				// Expand the network to include this node's connections
				expandHighlightNetwork(hoveredNode.id);
			} else {
				// Switch to highlight the new node and its network
				highlightNode(hoveredNode.id);
			}
			focusNode(hoveredNode, 800);
		}
	};

	function onPointerDown(ev: PointerEvent) {
		const p = toGraphCoords(ev);
		updateHover(p.x, p.y);
		if (!hoveredNode) return;
		draggingNode = hoveredNode;
		canvasEl.setPointerCapture(ev.pointerId);
		draggingNode.fx = p.x;
		draggingNode.fy = p.y;
		sim?.alphaTarget(0.3).restart();
		ev.preventDefault();
	}
	function onPointerMove(ev: PointerEvent) {
		if (!draggingNode) return;
		const p = toGraphCoords(ev);
		draggingNode.fx = p.x;
		draggingNode.fy = p.y;
		scheduleDraw();
	}
	function onPointerUp() {
		if (!draggingNode) return;
		draggingNode.fx = null;
		draggingNode.fy = null;
		draggingNode = null;
		sim?.alphaTarget(0);
	}

	let tooltipContent = $derived(() => {
		const n = hoveredNode;
		return {
			show: !!n,
			name: n?.name ?? '',
			category: n?.category ?? '',
			subscriberText: n?.subscriber_count
				? n.subscriber_count >= 1000
					? `${Math.round(n.subscriber_count / 1000)}k subscribers`
					: `${n.subscriber_count} subscribers`
				: 'No subscriber data',
			isBestseller: n?.is_bestseller ?? false
		};
	});

	function setupCanvasSize() {
		const rect = containerEl.getBoundingClientRect();
		width = Math.max(1, Math.floor(rect.width));
		height = Math.max(1, Math.floor(rect.height));
		dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
		canvasEl.width = width * dpr;
		canvasEl.height = height * dpr;
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		generateStars();
		scheduleDraw();
	}
	
	function generateStars() {
		stars = [];
		const numStars = Math.floor((width * height) / 3000); // Density of stars
		for (let i = 0; i < numStars; i++) {
			stars.push({
				x: Math.random() * width * dpr,
				y: Math.random() * height * dpr,
				size: Math.random() * 1.5 + 0.5,
				brightness: Math.random() * 0.8 + 0.2
			});
		}
	}

	onMount(async () => {
		if (!browser) return;

		try {
			const [{ forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide },
			       zoomMod,
			       selectionMod,
			       Q] = await Promise.all([
				import('d3-force'),
				import('d3-zoom'),
				import('d3-selection'),
				import('d3-quadtree')
			]);

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
				.scaleExtent([0.005, 64])
				.filter((event: any) => !draggingNode || event.type === 'wheel')
				.on('zoom', (event: any) => {
					transform = {
						k: event.transform.k,
						x: event.transform.x * dpr,
						y: event.transform.y * dpr
					};
					scheduleDraw();
				});

			d3select(canvasEl).call(d3zoom as any);

			// pointer/hover/click
			canvasEl.addEventListener('pointerdown', onPointerDown);
			canvasEl.addEventListener('pointermove', onPointerMove);
			canvasEl.addEventListener('pointerup', onPointerUp);
			canvasEl.addEventListener('mousemove', handleMouseMove);
			canvasEl.addEventListener('click', handleClick);

			// keyboard: press "f" to zoom-to-fit
			window.addEventListener('keydown', (e) => {
				if (e.key.toLowerCase() === 'f') zoomToFit(60, 500);
			});

			// d3-force (2D)
			const nodes = graphData.nodes;
			const links = graphData.links.map((l: any) => ({ ...l })); // shallow copy
			renderLinks = links; // render the same (mutated) array

			// give each link a stable sampling key once
			for (const l of links) {
				const sid = typeof l.source === 'object' ? l.source.id : l.source;
				const tid = typeof l.target === 'object' ? l.target.id : l.target;
				l._r = hash01(String(sid) + '|' + String(tid));
			}

			sim = forceSimulation(nodes)
				.force('link', forceLink(links).id((d: any) => d.id)
					.distance((l: any) => {
						const sv = l.source?.val ?? 1;
						const tv = l.target?.val ?? 1;
						return 40 + 4 * Math.sqrt(Math.min(sv, tv));
					})
					.strength(0.6)
				)
				.force('charge', forceManyBody().strength(-120))
				.force('collide', forceCollide((n: any) => nodeRadius(n)))
				.force('center', forceCenter(0, 0))
				.alphaDecay(0.02)
				.velocityDecay(0.3)
				.on('tick', () => {
					rebuildQuadtree();
					// throttle ticks to animation frames
					scheduleDraw();
				});

			isInitialized = true;

			setTimeout(() => zoomToFit(60, 500), 350);
		} catch (e: any) {
			error = e?.message ?? 'Failed to initialize d3-force 2D graph';
		}
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
				window?.removeEventListener?.('keydown', () => {});
			} catch {}
			sim = null;
		};
	});

	$effect(() => {
		if (isInitialized) scheduleDraw();
	});
</script>

<div class="relative h-full w-full" bind:this={containerEl}>
	<canvas bind:this={canvasEl} class="block h-full w-full" />

	{#if error}
		<div class="absolute inset-0 grid place-items-center">
			<div class="preset-filled-error-800-200 rounded-lg p-6">
				<h3 class="h3">Graph Error</h3>
				<p>{error}</p>
			</div>
		</div>
	{:else if !browser || !isInitialized}
		<div class="absolute inset-0 grid place-items-center">
			<div class="preset-filled-surface-100-900 rounded-lg p-6">
				<h3 class="h3">Loading 2D Graph…</h3>
				<p class="mt-2">Initializing tens of thousands of newsletter recommendations</p>
			</div>
		</div>
	{:else}
		<div class="absolute top-2 left-2 z-10">
			<div class="preset-filled-surface-100-900/20f rounded-lg p-2 opacity-80">
				<p class="text-sm">
					Press <kbd>F</kbd> to fit
				</p>
			</div>
		</div>
	{/if}

	{#if hoveredNode}
		<div
			class="pointer-events-none fixed z-[9999]"
			style="left: {tooltipPosition.x + 15}px; top: {tooltipPosition.y - 10}px;"
		>
			<div class="preset-filled-surface-100-900 max-w-sm card border border-surface-400 p-4 shadow-xl">
				<header class="card-header pb-2">
					<h4 class="text-on-surface h4 font-semibold">{hoveredNode.name}</h4>
				</header>
				<section class="card-body space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm opacity-75">Category:</span>
						<span class="text-sm font-medium">{hoveredNode.category}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm opacity-75">Subscribers:</span>
						<span class="text-sm font-medium">
							{hoveredNode.subscriber_count
								? (hoveredNode.subscriber_count >= 1000
									? `${Math.round(hoveredNode.subscriber_count / 1000)}k subscribers`
									: `${hoveredNode.subscriber_count} subscribers`)
								: 'No subscriber data'}
						</span>
					</div>
					{#if hoveredNode.is_bestseller}
						<div class="pt-2">
							<span class="bg-orange-500 badge">Bestseller</span>
						</div>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>
