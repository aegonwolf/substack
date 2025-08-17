# Chat
Create a custom chat feed or AI prompt interface.

<Preview client:visible>
	<Fragment slot="preview">
		<Example client:visible />
	</Fragment>
	<Fragment slot="codeReact">
		<Code code={`Coming soon...`} lang="tsx" />
	</Fragment>
	<Fragment slot="codeSvelte">
		<Code code={ExampleRaw} lang="svelte" />
	</Fragment>
</Preview>

## Layout Columns

Use Tailwind's [grid column](https://tailwindcss.com/docs/grid-template-columns) utility classes to define horizontal columns for your layout.

```html
<!--
https://tailwindcss.com/docs/grid-template-columns#arbitrary-values
- auto: size to content widths
- 1fr: fill available space evenly
- {amount}: set fixed size (ex: 320px)
-->
<div class="w-full grid grid-cols-[auto_1fr_auto] gap-1">
	<div class="bg-surface-100-900 p-4">(nav)</div>
	<div class="bg-surface-100-900 p-4">(feed)</div>
	<div class="bg-surface-100-900 p-4">(online)</div>
</div>

```

## Layout Rows

Use Tailwind's [grid row](https://tailwindcss.com/docs/grid-template-rows) utility classes to define vertical layout rows for your layout.

```html
<!--
https://tailwindcss.com/docs/grid-template-rows#arbitrary-values
- auto: size to content widths
- 1fr: fill available space evenly
- {amount}: set fixed size (ex: 320px)
-->
<div class="w-full grid grid-cols-2 gap-10">
	<!-- Three Row Layout -->
	<div class="h-full grid grid-rows-[auto_1fr_auto] gap-1">
		<div class="bg-surface-100-900 p-4">(search)</div>
		<div class="bg-surface-100-900 p-4">(list)</div>
		<div class="bg-surface-100-900 p-4">(footer)</div>
	</div>
	<!-- Two Row Layout -->
	<div class="h-full grid grid-rows-[1fr_auto] gap-1">
		<!-- We've set a max height here to trigger the vertical overflow. -->
		<!-- Removed max-h and space-y in your project. -->
		<div class="bg-surface-100-900 p-4 overflow-y-auto max-h-[128px] space-y-4">
			<p>(feed)</p>
			<p>
				Lorem, ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit dolor ullam, qui et itaque quam distinctio dicta nostrum
				veritatis harum iure hic sequi aperiam, explicabo earum totam deserunt. Fugiat, temporibus.
			</p>
		</div>
		<div class="bg-surface-100-900 p-4">(prompt)</div>
	</div>
</div>

```

## Message Feed

The feed simply loops through the available feed data. Each `<pre>` tag represents a single _bubble_ element.

```html
---
let messageFeed = [
	{
		id: 0,
		host: true,
		avatar: 48,
		name: 'Jane',
		timestamp: 'Yesterday @ 2:30pm',
		message: 'Some message text.',
		color: 'variant-soft-primary'
	},
	{
		id: 1,
		host: false,
		avatar: 14,
		name: 'Michael',
		timestamp: 'Yesterday @ 2:45pm',
		message: 'Some message text.',
		color: 'variant-soft-primary'
	}
];
---

<section class="w-full max-h-[400px] overflow-y-auto space-y-4">
	<!-- Loop through the messageFeed array -->
	{
		messageFeed.map((bubble) => {
			// Determine if host/guest role
			const role = bubble.host === true ? 'host' : 'guest';
			// Render the bubble template
			return <pre class="pre">{JSON.stringify({ role, ...bubble }, null, 2)}</pre>;
		})
	}
</section>

```

## Message Bubbles

Provide styling to each bubble element.

```html
---

let messageFeed = [
	{
		id: 0,
		host: true,
		avatar: 48,
		name: 'Jane',
		timestamp: 'Yesterday @ 2:30pm',
		message: 'Some message text.',
		color: 'preset-tonal-primary'
	},
	{
		id: 1,
		host: false,
		avatar: 14,
		name: 'Michael',
		timestamp: 'Yesterday @ 2:45pm',
		message: 'Some message text.',
		color: 'preset-tonal-primary'
	}
];
---

<section class="w-full max-h-[400px] overflow-y-auto space-y-4">
	<!-- Loop through the messageFeed array -->
	{
		messageFeed.map((bubble) => {
			return (
				<>
					
					{bubble.host ? (
						// Host Bubble
						<div class="grid grid-cols-[auto_1fr] gap-2">
							<Avatar src={`https://i.pravatar.cc/?img=${bubble.avatar}`} name={bubble.name} size="size-12" />
							<div class="card p-4 preset-tonal rounded-tl-none space-y-2">
								<header class="flex justify-between items-center">
									<p class="font-bold">{bubble.name}</p>
									<small class="opacity-50">{bubble.timestamp}</small>
								</header>
								<p>{bubble.message}</p>
							</div>
						</div>
					) : (
						// Guest Bubble
						<div class="grid grid-cols-[1fr_auto] gap-2">
							<div class={`card p-4 rounded-tr-none space-y-2 ${bubble.color}`}>
								<header class="flex justify-between items-center">
									<p class="font-bold">{bubble.name}</p>
									<small class="opacity-50">{bubble.timestamp}</small>
								</header>
								<p>{bubble.message}</p>
							</div>
							<Avatar src={`https://i.pravatar.cc/?img=${bubble.avatar}`} name={bubble.name} size="size-12" />
						</div>
					)}
				</>
			);
		})
	}
</section>

```

## Prompt

Use Skeleton's [input group](/docs/tailwind/forms#groups) styles to create a custom text prompt.

---

## Scroll to Bottom
