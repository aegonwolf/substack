# Breadcrumbs
Displays the current navigation hierarchy.

```html
<ol class="flex items-center gap-4">
	<li><a class="opacity-60 hover:underline" href="#">Blog</a></li>
	<li class="opacity-50" aria-hidden>&rsaquo;</li>
	<li><a class="opacity-60 hover:underline" href="#">Category</a></li>
	<li class="opacity-50" aria-hidden>&rsaquo;</li>
	<li>Article</li>
</ol>

```

## Icons

Feel free to mix in icons for the anchor labels or separators.

```html
---
---

<ol class="flex items-center gap-4">
	<li>
		<a class="opacity-60 hover:opacity-100" href="#">
			<House size={24} />
		</a>
	</li>
	<li class="opacity-50" aria-hidden>
		<ChevronRight size={14} />
	</li>
	<li>
		<a class="opacity-60 hover:opacity-100" href="#">
			<Cog size={24} />
		</a>
	</li>
	<li class="opacity-50" aria-hidden>
		<ChevronRight size={14} />
	</li>
	<li>Current</li>
</ol>

```
