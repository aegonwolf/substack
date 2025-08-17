
# Presets
Canned styles for your interface elements.

{

<p className="text-xl">
	Presets are pre-defined styles that allow you to quickly and easily style buttons, badges, cards, and more. Create by mixing Skeleton and
	Tailwind primitives.
</p>

}

```html
<script lang="ts">
	import IconBookmark from '@lucide/svelte/icons/bookmark';
	const diagramCircle = 'preset-tonal w-8 aspect-square flex justify-center items-center rounded-full';
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-10">
	<!-- 1. Filled -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-filled-primary-500">Filled</button>
		<div class={diagramCircle}>1</div>
	</div>
	<!-- 2. Tonal -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-tonal-primary">Tonal</button>
		<div class={diagramCircle}>2</div>
	</div>
	<!-- 3. Outlined -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-outlined-primary-500">Outlined</button>
		<div class={diagramCircle}>3</div>
	</div>
	<!-- 4. Glass -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-glass-primary">Glass</button>
		<div class={diagramCircle}>4</div>
	</div>
	<!-- 5. Elevated -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-filled-surface-100-900 shadow-xl">Elevated</button>
		<div class={diagramCircle}>5</div>
	</div>
	<!-- 6. Ghost -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn hover:preset-tonal">Ghost</button>
		<div class={diagramCircle}>6</div>
	</div>
	<!-- 7. Ghost (Icon) -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn hover:preset-tonal-primary">
			<IconBookmark className="size-6" />
		</button>
		<div class={diagramCircle}>7</div>
	</div>
	<!-- 8. Gradient -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-gradient">Gradient</button>
		<div class={diagramCircle}>8</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-gradient {
		background-image: linear-gradient(-45deg, var(--color-primary-300), var(--color-primary-700));
		color: var(--color-primary-contrast-500);
	}
	.preset-glass-primary {
		background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-primary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>

```

1. **Filled** - a filled preset of the primary brand color.
2. **Tonal** - a tonal preset of the primary brand color.
3. **Outlined** - an outlined preset of the primary brand color.
4. **Glass** - a custom preset using background transparency and backdrop blur.
5. **Elevated** - mixes a filled preset with a shadow.
6. **Ghost** - has no style by default, but shows a tonal preset on hover.
7. **Ghost Icon** - has no style by default, but shows a branded tonal preset on hover.
8. **Gradient** - a custom preset generated using Tailwind gradient primitives.

## Enabling Presets

Skeleton provides an optional set of presets for `filled`, `tonal`, and `outlined` styles. To enable these, simply add the following import to your global stylesheet. This is recommended for new users to Skeleton.

```css
@import '@skeletonlabs/skeleton/optional/presets';
```

## Skeleton Presets

Skeleton's provides the following opinionated set of styles, including accessible backgrounds and text colors.

### Filled

```
preset-filled-{color}-{lightModeShade}-{darkModeShade}
```

```html
<div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
	
	<div class="preset-filled flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-filled-primary-950-50 flex items-center justify-center p-4">950-50</div>
	<div class="preset-filled-primary-900-100 flex items-center justify-center p-4">900-100</div>
	<div class="preset-filled-primary-800-200 flex items-center justify-center p-4">800-200</div>
	<div class="preset-filled-primary-700-300 flex items-center justify-center p-4">700-300</div>
	<div class="preset-filled-primary-600-400 flex items-center justify-center p-4">600-400</div>
	<div class="preset-filled-primary-500 flex items-center justify-center p-4">500</div>
	<div class="preset-filled-primary-400-600 flex items-center justify-center p-4">400-600</div>
	<div class="preset-filled-primary-300-700 flex items-center justify-center p-4">300-700</div>
	<div class="preset-filled-primary-200-800 flex items-center justify-center p-4">200-800</div>
	<div class="preset-filled-primary-100-900 flex items-center justify-center p-4">100-900</div>
	<div class="preset-filled-primary-50-950 flex items-center justify-center p-4">50-950</div>
</div>

```

### Tonal

```
preset-tonal-{color}
```

```html
<div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
	
	<div class="preset-tonal flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-tonal-primary flex items-center justify-center p-4">primary</div>
	<div class="preset-tonal-secondary flex items-center justify-center p-4">secondary</div>
	<div class="preset-tonal-tertiary flex items-center justify-center p-4">tertiary</div>
	<div class="preset-tonal-success flex items-center justify-center p-4">success</div>
	<div class="preset-tonal-warning flex items-center justify-center p-4">warning</div>
	<div class="preset-tonal-error flex items-center justify-center p-4">error</div>
	<div class="preset-tonal-surface flex items-center justify-center p-4">surface</div>
</div>

```

### Outlined

```
preset-outlined-{color}-{shade}-{shade}
```

```html
<div class="grid w-full grid-cols-2 gap-2 lg:grid-cols-4">
	
	<div class="preset-outlined flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-outlined-primary-950-50 flex items-center justify-center p-4">950-50</div>
	<div class="preset-outlined-primary-900-100 flex items-center justify-center p-4">900-100</div>
	<div class="preset-outlined-primary-800-200 flex items-center justify-center p-4">800-200</div>
	<div class="preset-outlined-primary-700-300 flex items-center justify-center p-4">700-300</div>
	<div class="preset-outlined-primary-600-400 flex items-center justify-center p-4">600-400</div>
	<div class="preset-outlined-primary-500 flex items-center justify-center p-4">500</div>
	<div class="preset-outlined-primary-400-600 flex items-center justify-center p-4">400-600</div>
	<div class="preset-outlined-primary-300-700 flex items-center justify-center p-4">300-700</div>
	<div class="preset-outlined-primary-200-800 flex items-center justify-center p-4">200-800</div>
	<div class="preset-outlined-primary-100-900 flex items-center justify-center p-4">100-900</div>
	<div class="preset-outlined-primary-50-950 flex items-center justify-center p-4">50-950</div>
</div>

```

## Custom Presets

For advanced users, we recommend disabling the Skeleton presets in favor of custom-generated presets. This ensures you retain full control over the look and feel of each element. Consider these best practices when creating presets.

- Custom presets are only limited by your imagination.
- Use any combination of Skeleton or Tailwind-provided primitive to generate a preset.
- Apply presets to any relevant element, including: buttons, cards, inputs, and more.
- Use a set naming convention, such as `preset-{foo}` to keep things standardized.
- Implement all presets in using Tailwind's [@utility directive](https://tailwindcss.com/docs/functions-and-directives#utility-directive) in your global stylesheet.
- Abstrast presets to a stylesheet or NPM package for shared used between projects.

```html
<div class="w-full max-w-[320px] grid grid-rows-3 gap-4">
	<input type="text" class="input" value="Default Input State!" />
	<input type="text" class="input preset-input-success" value="Valid Input State!" />
	<input type="text" class="input preset-input-error" value="Invalid Input State!" />
</div>

<style>
	/* Add each custom preset to your global stylesheet. */
	.preset-input-success {
		background-color: var(--color-success-100);
		color: var(--color-success-900);
	}
	.preset-input-error {
		background-color: var(--color-error-100);
		color: var(--color-error-900);
	}
</style>

```

### Gradient Presets

Tailwind provides a number of powerful [Gradient](https://tailwindcss.com/docs/gradient-color-stops) utility classes that can be used to generate presets.

```html
<div class="w-full space-y-4">
	<div class="grid grid-cols-3 gap-4">
		<button class="btn preset-gradient-one">Button</button>
		<button class="btn preset-gradient-two">Button</button>
		<button class="btn preset-gradient-three">Button</button>
	</div>
	<div class="grid grid-cols-3 gap-4 text-center">
		<div class="card p-4 preset-gradient-one">Card</div>
		<div class="card p-4 preset-gradient-two">Card</div>
		<div class="card p-4 preset-gradient-three">Card</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-gradient-one {
		background-image: linear-gradient(45deg, var(--color-primary-500), var(--color-tertiary-500));
		color: var(--color-primary-contrast-500);
	}
	.preset-gradient-two {
		background-image: linear-gradient(45deg, var(--color-error-500), var(--color-warning-500));
		color: var(--color-error-contrast-500);
	}
	.preset-gradient-three {
		background-image: linear-gradient(45deg, var(--color-success-500), var(--color-warning-500));
		color: var(--color-success-contrast-500);
	}
</style>

```

### Glass Presets

```html
---
const baseClasses = 'card p-4 text-white text-center flex justify-start items-center';
---

<div
	class="w-full space-y-4 bg-[url(https://picsum.photos/id/249/1024/1024)] bg-center bg-no-repeat bg-cover rounded-container flex justify-center items-center p-4"
>
	<div class="w-full grid grid-cols-1 gap-2">
		<div class:list={`${baseClasses} preset-glass-neutral`}>Neutral</div>
		<div class:list={`${baseClasses} preset-glass-primary`}>Primary</div>
		<div class:list={`${baseClasses} preset-glass-secondary`}>Secondary</div>
		<div class:list={`${baseClasses} preset-glass-tertiary`}>Tertiary</div>
		<div class:list={`${baseClasses} preset-glass-success`}>Success</div>
		<div class:list={`${baseClasses} preset-glass-warning`}>Warning</div>
		<div class:list={`${baseClasses} preset-glass-error`}>Error</div>
		<div class:list={`${baseClasses} preset-glass-surface`}>Surface</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-glass-neutral {
		background: color-mix(in oklab, var(--color-surface-50-950) 30%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-50-950) 30%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	/* --- */
	.preset-glass-primary {
		background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-primary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-secondary {
		background: color-mix(in oklab, var(--color-secondary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-secondary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-tertiary {
		background: color-mix(in oklab, var(--color-tertiary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-tertiary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-success {
		background: color-mix(in oklab, var(--color-success-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-success-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-warning {
		background: color-mix(in oklab, var(--color-warning-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-warning-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-error {
		background: color-mix(in oklab, var(--color-error-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-error-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-surface {
		background: color-mix(in oklab, var(--color-surface-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>

```