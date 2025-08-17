# Alerts
General purpose notifications to attract attention and provide critical actions.

```html
<div class="w-full card preset-outlined-surface-950-50 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[1fr_auto]">
	<div>
		<p class="font-bold">Hey, heads up!</p>
		<p class="text-xs opacity-60">Something of moderate importance has occurred.</p>
	</div>
	<div class="flex gap-1">
		<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
	</div>
</div>

```

## Styling

For even more customization, try mixing and matching various [Presets](/docs/design/presets) classes.

```html
---
---

<div class="w-full space-y-8">
	
	<div class="card preset-outlined-success-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[1fr_auto]">
		<div>
			<p class="font-bold">Success</p>
			<p class="text-xs opacity-60">The task has been completed successfully.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
	
	<div class="card preset-outlined-warning-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
		<TriangleAlert />
		<div>
			<p class="font-bold">Warning</p>
			<p class="text-xs opacity-60">Beware of this important notice.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
	
	<div class="card preset-outlined-error-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
		<TriangleAlert />
		<div>
			<p class="font-bold">Error</p>
			<p class="text-xs opacity-60">Something has gone wrong.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
</div>

```
