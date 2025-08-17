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

	// quadtree for hittest
	let Quadtree: any;
	let qt: any = null;

	// size / DPR
	let width = 0, height = 0, dpr = 1;
	let resizeObserver: ResizeObserver;

	let isInitialized = $state(false);
	let error = $state<string | null>(null);

	const nodeRadius = (n: any) => 2 + Math.sqrt(n?.val ?? 1) * 1.6;
	const showLabels = () => transform.k > 1.5;

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
		ctx.save();

		// clear + bg
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width * dpr, height * dpr);
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, width * dpr, height * dpr);

		// apply zoom
		ctx.setTransform(transform.k, 0, 0, transform.k, transform.x, transform.y);

		// links
		ctx.beginPath();
		for (const l of graphData.links) {
			const s: any = l.source, t: any = l.target;
			if (!s || !t) continue;
			ctx.moveTo(s.x, s.y);
			ctx.lineTo(t.x, t.y);
		}
		ctx.globalAlpha = 0.45;
		ctx.lineWidth = 1 / transform.k;
		ctx.strokeStyle = 'rgba(150,150,150,0.6)';
		ctx.stroke();
		ctx.globalAlpha = 1;

		// nodes
		for (const n of graphData.nodes) {
			const r = nodeRadius(n);
			ctx.beginPath();
			ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
			ctx.fillStyle = n.color ?? '#ccc';
			ctx.fill();
		}

		// labels at higher zoom
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

		// hover ring
		if (hoveredNode) {
			const r = nodeRadius(hoveredNode);
			ctx.beginPath();
			ctx.arc(hoveredNode.x, hoveredNode.y, r + 3 / transform.k, 0, Math.PI * 2);
			ctx.lineWidth = 2 / transform.k;
			ctx.strokeStyle = 'rgba(255,255,255,0.9)';
			ctx.stroke();
		}

		ctx.restore();
	}

	function focusNode(n: any, duration = 800, targetK = Math.min(8, Math.max(2, transform.k * 1.3))) {
		if (!n || !d3zoom) return;
		const cx = (width * dpr) / 2, cy = (height * dpr) / 2;
		const tx = cx - n.x * targetK;
		const ty = cy - n.y * targetK;
		animateTransform({ k: targetK, x: tx, y: ty }, duration);
	}

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
			draw();
			if (u < 1) requestAnimationFrame(step);
			else {
				// sync d3-zoom internal state
				d3select(canvasEl).call(
					d3zoom.transform,
					zoomIdentity.translate(end.x / dpr, end.y / dpr).scale(end.k)
				);
			}
		}
		requestAnimationFrame(step);
	}

	// NEW: zoom-to-fit (call anytime)
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
		if (hoveredNode) focusNode(hoveredNode, 800);
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
		draw();
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
		draw();
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

			// Wider zoom range 👇
			d3zoom = zoom<HTMLCanvasElement, unknown>()
				.scaleExtent([0.005, 64])  // << allow way farther zoom-out & zoom-in
				.filter((event: any) => !draggingNode || event.type === 'wheel')
				.on('zoom', (event: any) => {
					transform = {
						k: event.transform.k,
						x: event.transform.x * dpr,
						y: event.transform.y * dpr
					};
					draw();
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
			const links = graphData.links.map((l: any) => ({ ...l }));

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
					draw();
				});

			isInitialized = true;

			// settle a bit then fit everything in view
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
		if (isInitialized) draw();
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
				<p class="mt-2">Initializing {graphData.metadata.total_nodes} nodes…</p>
			</div>
		</div>
	{:else}
		<div class="absolute top-2 left-2 z-10">
			<div class="preset-filled-surface-100-900 rounded-lg p-2 opacity-80">
				<p class="text-sm">
					2D (d3-force) • Nodes: {graphData.metadata.total_nodes} • Links: {graphData.metadata.total_links} • Press <kbd>F</kbd> to fit
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
