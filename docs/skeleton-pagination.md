
# Pagination
Navigate between multiple pages of content.

```svelte
<script lang="ts">
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';

	interface SourceData {
		position: number;
		name: string;
		weight: number;
		symbol: string;
	}

	let sourceData: SourceData[] = $state([
		{ position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
		{ position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
		{ position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
		{ position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
		{ position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
		{ position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
		{ position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
		{ position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
		{ position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
		{ position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' }
	]);

	// State
	let page = $state(1);
	let size = $state(5);
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));
</script>

<section class="space-y-4">
	<!-- Table -->
	<div class="table-wrap">
		<table class="table table-fixed caption-bottom">
			<thead>
				<tr>
					<th>Position</th>
					<th>Name</th>
					<th>Weight</th>
					<th class="!text-right">Symbol</th>
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:preset-tonal-primary">
				{#each slicedSource(sourceData) as row}
					<tr>
						<td>{row.position}</td>
						<td>{row.name}</td>
						<td>{row.weight}</td>
						<td class="text-right">{row.symbol}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<!-- Footer -->
	<footer class="flex justify-between">
		<select name="size" id="size" class="select max-w-[150px]" value={size} onchange={(e) => (size = Number(e.currentTarget.value))}>
			{#each [1, 2, 5] as v}
				<option value={v}>Items {v}</option>
			{/each}
			<option value={sourceData.length}>Show All</option>
		</select>
		<!-- Pagination -->
		<Pagination
			data={sourceData}
			{page}
			onPageChange={(e) => (page = e.page)}
			pageSize={size}
			onPageSizeChange={(e) => (size = e.pageSize)}
			siblingCount={4}
		>
			{#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
			{#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
			{#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
			{#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
			{#snippet labelLast()}<IconLast class="size-4" />{/snippet}
		</Pagination>
	</footer>
</section>

```

## Alternative UI

Display an alternative interface using the `alternative` property.

```svelte
<script lang="ts">
	import { Pagination } from '@skeletonlabs/skeleton-svelte';

	const sourceData = [{ id: 0 }, { id: 1 }, { id: 3 }, { id: 4 }];
</script>

<Pagination data={sourceData} count={sourceData.length} page={1} pageSize={3} alternative />

```

## Handling Total Count

If your source data is pre-truncated (ex: server-side pagination). Make sure to specify the total item `count`.

```json
// Mock Server Response
pagination: {
	"page": 1,
	"limit": 2,
	"pages": 1,
	"total": 1, // <----
	"next": null,
	"prev": null
}
```

```svelte
<Pagination count={pagination.total} ... />
```

## Anatomy

<Anatomy label="Pagination" isComponent>
	<Anatomy label="button" descriptor="(first)" tag="button" />
	<Anatomy label="button" descriptor="(numerals)" tag="button" />
	<Anatomy label="button" descriptor="(ellipsis)" tag="span" />
	<Anatomy label="button" descriptor="(last)" tag="button" />
</Anatomy>

## API Reference

### Pagination

| Property | Type | Description |
| --- | --- | --- |
| `data`* | unknown[] | Provide source data as an array. |
| `alternative` | boolean | Enables alternative display with stats and first/last buttons. |
| `textSeparator` | string | Set the separator text or character, such as "of" in "X of Y". |
| `showFirstLastButtons` | boolean | Show first and last page button. |
| `base` | string | Sets base classes for the list. |
| `background` | string | Sets background classes for the list. |
| `border` | string | Sets border classes for the list. |
| `gap` | string | Sets gap classes for the list. |
| `padding` | string | Sets padding classes for the list. |
| `rounded` | string | Sets border radius classes for the list. |
| `classes` | string | Provide arbitrary CSS classes for the root. |
| `titleFirst` | string | Set an optional title for the first button. |
| `titlePrevious` | string | Set an optional title for the previous button. |
| `titleNumeral` | string | Set an optional title for the numeral buttons (ex: Page 1). |
| `titleNext` | string | Set an optional title for the next button. |
| `titleLast` | string | Set an optional title for the last button. |
| `buttonBase` | string | Sets base classes for buttons. |
| `buttonActive` | string | Sets active state classes for buttons. |
| `buttonInactive` | string | Sets inactive state classes for buttons. |
| `buttonHover` | string | Sets hover state classes for buttons. |
| `buttonClasses` | string | Provide arbitrary CSS classes for buttons. |
| `labelFirst` | Snippet<[]> | Set button icon or label for first button. |
| `labelPrevious` | Snippet<[]> | Set button icon or label for previous button. |
| `labelEllipsis` | Snippet<[]> | Set button icon or label for ellipsis. |
| `labelNext` | Snippet<[]> | Set button icon or label for next button. |
| `labelLast` | Snippet<[]> | Set button icon or label for last button. |
| `ids` | Partial<{ root: string; ellipsis(index: number): string; prevTrigger: string; nextTrigger: string; item(page: number): string; }> | The ids of the elements in the accordion. Useful for composition. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `translations` | IntlTranslations | Specifies the localized strings that identifies the accessibility elements and their states |
| `count` | number | Total number of data items |
| `pageSize` | number | The controlled number of data items per page |
| `defaultPageSize` | number | The initial number of data items per page when rendered. Use when you don't need to control the page size of the pagination. Default: 10 |
| `siblingCount` | number | Number of pages to show beside active page Default: 1 |
| `page` | number | The controlled active page |
| `defaultPage` | number | The initial active page when rendered. Use when you don't need to control the active page of the pagination. Default: 1 |
| `onPageChange` | (details: PageChangeDetails) => void | Called when the page number is changed |
| `onPageSizeChange` | (details: PageSizeChangeDetails) => void | Called when the page size is changed |
| `type` | "button" | "link" | The type of the trigger element Default: "button" |

---