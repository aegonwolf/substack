### +layout.svelte

To create a layout that applies to every page, make a file called `src/routes/+layout.svelte`. The default layout (the one that SvelteKit uses if you don't bring your own) looks like this...

```svelte
<script>
	let { children } = $props();
</script>

{@render children()}
```

...but we can add whatever markup, styles and behaviour we want. The only requirement is that the component includes a `@render` tag for the page content. For example, let's add a nav bar:

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">Home</a>
	<a href="/about">About</a>
	<a href="/settings">Settings</a>
</nav>

{@render children()}
```

If we create pages for `/`, `/about` and `/settings`...

```html
/// file: src/routes/+page.svelte
<h1>Home</h1>
```

```html
/// file: src/routes/about/+page.svelte
<h1>About</h1>
```

```html
/// file: src/routes/settings/+page.svelte
<h1>Settings</h1>
```

...the nav will always be visible, and clicking between the three pages will only result in the `<h1>` being replaced.

Layouts can be _nested_. Suppose we don't just have a single `/settings` page, but instead have nested pages like `/settings/profile` and `/settings/notifications` with a shared submenu (for a real-life example, see [github.com/settings](https://github.com/settings)).

We can create a layout that only applies to pages below `/settings` (while inheriting the root layout with the top-level nav):

```svelte
<!--- file: src/routes/settings/+layout.svelte --->
<script>
	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();
</script>

<h1>Settings</h1>

<div class="submenu">
	{#each data.sections as section}
		<a href="/settings/{section.slug}">{section.title}</a>
	{/each}
</div>

{@render children()}
```

> [!LEGACY]
> `LayoutProps` was added in 2.16.0. In earlier versions, you had to [type the properties manually instead](#\$types).

You can see how `data` is populated by looking at the `+layout.js` example in the next section just below.

By default, each layout inherits the layout above it. Sometimes that isn't what you want - in this case, [advanced layouts](advanced-routing#Advanced-layouts) can help you.

### +layout.js

Just like `+page.svelte` loading data from `+page.js`, your `+layout.svelte` component can get data from a [`load`](load) function in `+layout.js`.

```js
/// file: src/routes/settings/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return {
		sections: [
			{ slug: 'profile', title: 'Profile' },
			{ slug: 'notifications', title: 'Notifications' }
		]
	};
}
```

If a `+layout.js` exports [page options](page-options) — `prerender`, `ssr` and `csr` — they will be used as defaults for child pages.

Data returned from a layout's `load` function is also available to all its child pages:

```svelte
<!--- file: src/routes/settings/profile/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	console.log(data.sections); // [{ slug: 'profile', title: 'Profile' }, ...]
</script>
```

> [!NOTE] Often, layout data is unchanged when navigating between pages. SvelteKit will intelligently rerun [`load`](load) functions when necessary.

### +layout.server.js

To run your layout's `load` function on the server, move it to `+layout.server.js`, and change the `LayoutLoad` type to `LayoutServerLoad`.

Like `+layout.js`, `+layout.server.js` can export [page options](page-options) — `prerender`, `ssr` and `csr`.

## +server

As well as pages, you can define routes with a `+server.js` file (sometimes referred to as an 'API route' or an 'endpoint'), which gives you full control over the response. Your `+server.js` file exports functions corresponding to HTTP verbs like `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`, and `HEAD` that take a [`RequestEvent`](@sveltejs-kit#RequestEvent) argument and return a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object.

For example we could create an `/api/random-number` route with a `GET` handler:

```js
/// file: src/routes/api/random-number/+server.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const min = Number(url.searchParams.get('min') ?? '0');
	const max = Number(url.searchParams.get('max') ?? '1');

	const d = max - min;

	if (isNaN(d) || d < 0) {
		error(400, 'min and max must be numbers, and min must be less than max');
	}

	const random = min + Math.random() * d;

	return new Response(String(random));
}
```

The first argument to `Response` can be a [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream), making it possible to stream large amounts of data or create server-sent events (unless deploying to platforms that buffer responses, like AWS Lambda).

You can use the [`error`](@sveltejs-kit#error), [`redirect`](@sveltejs-kit#redirect) and [`json`](@sveltejs-kit#json) methods from `@sveltejs/kit` for convenience (but you don't have to).

If an error is thrown (either `error(...)` or an unexpected error), the response will be a JSON representation of the error or a fallback error page — which can be customised via `src/error.html` — depending on the `Accept` header. The [`+error.svelte`](#error) component will _not_ be rendered in this case. You can read more about error handling [here](errors).

> [!NOTE] When creating an `OPTIONS` handler, note that Vite will inject `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods` headers — these will not be present in production unless you add them.

> [!NOTE] `+layout` files have no effect on `+server.js` files. If you want to run some logic before each request, add it to the server [`handle`](hooks#Server-hooks-handle) hook.

### Receiving data

By exporting `POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`/`HEAD` handlers, `+server.js` files can be used to create a complete API:

```svelte
<!--- file: src/routes/add/+page.svelte --->
<script>
	let a = 0;
	let b = 0;
	let total = 0;

	async function add() {
		const response = await fetch('/api/add', {
			method: 'POST',
			body: JSON.stringify({ a, b }),
			headers: {
				'content-type': 'application/json'
			}
		});

		total = await response.json();
	}
</script>

<input type="number" bind:value={a}> +
<input type="number" bind:value={b}> =
{total}

<button onclick={add}>Calculate</button>
```

```js
/// file: src/routes/api/add/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}
```

> [!NOTE] In general, [form actions](form-actions) are a better way to submit data from the browser to the server.

> [!NOTE] If a `GET` handler is exported, a `HEAD` request will return the `content-length` of the `GET` handler's response body.

### Fallback method handler

Exporting the `fallback` handler will match any unhandled request methods, including methods like `MOVE` which have no dedicated export from `+server.js`.

```js
/// file: src/routes/api/add/+server.js
import { json, text } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}

// This handler will respond to PUT, PATCH, DELETE, etc.
/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }) {
	return text(`I caught your ${request.method} request!`);
}
```

> [!NOTE] For `HEAD` requests, the `GET` handler takes precedence over the `fallback` handler.