
# Svelte 5 Documentation Table of Contents

This file provides a table of contents for the Svelte 5 documentation, with a brief summary of each file's content.

## Svelte 5 Core Concepts

*   **[svelte5-getting-started.md](svelte5-getting-started.md)**: Instructions on how to get started with Svelte 5, including creating a new project with SvelteKit, editor tooling, and where to get help.
*   **[svelte5-svelte-files.md](svelte5-svelte-files.md)**: Explains the structure of `.svelte` files, including the `<script>`, `<script module>`, and `<style>` blocks.
*   **[svelte5-svelte-js-and-ts-files.md](svelte5-svelte-js-and-ts-files.md)**: Introduces `.svelte.js` and `.svelte.ts` files, which allow for the use of runes in regular JavaScript/TypeScript modules for reusable reactive logic.
*   **[svelte5-basic-markup.md](svelte5-basic-markup.md)**: Covers the basics of Svelte's template syntax, including HTML tags, component tags, attributes, props, spread attributes, events, text expressions, and comments.

## Svelte 5 Runes

*   **[svelte5-runes-introduction.md](svelte5-runes-introduction.md)**: Introduces the concept of runes in Svelte 5, explaining what they are and how they differ from regular JavaScript functions.
*   **[svelte5-rune-state.md](svelte5-rune-state.md)**: Explains the `$state` rune for creating reactive state, including deep state with proxies, using `$state` with classes, and the `$state.raw` and `$state.snapshot` variations.
*   **[svelte5-rune-derived.md](svelte5-rune-derived.md)**: Covers the `$derived` rune for creating derived state, including `$derived.by` for complex derivations, how dependencies are tracked, and how to override derived values.
*   **[svelte5-rune-effect.md](svelte5-rune-effect.md)**: Explains the `$effect` rune for running side effects in response to state changes, including its lifecycle, dependency tracking, and the `$effect.pre`, `$effect.tracking`, `$effect.pending` and `$effect.root` variations.
*   **[svelte5-rune-props.md](svelte5-rune-props.md)**: Details the `$props` rune for declaring and using component props, including fallback values, renaming, rest props, and type safety. It also introduces `$props.id()` for generating unique IDs.
*   **[svelte5-rune-bindable.md](svelte5-rune-bindable.md)**: Explains the `$bindable` rune, which allows for two-way data binding on component props.
*   **[svelte5-rune-host.md](svelte5-rune-host.md)**: Describes the `$host` rune, which provides access to the host element of a custom element.
*   **[svelte5-rune-inspect.md](svelte5-rune-inspect.md)**: Covers the `$inspect` rune for debugging, which is similar to `console.log` but re-runs when its arguments change. It also introduces `$inspect.trace()` for tracing function re-runs.

## Svelte 5 Control Flow Blocks

*   **[svelte5-if-block.md](svelte5-if-block.md)**: Explains how to conditionally render content using `{#if ...}`, `{:else if ...}`, and `{:else}` blocks.
*   **[svelte5-each-block.md](svelte5-each-block.md)**: Covers how to iterate over lists of values using `{#each ...}` blocks, including keyed each blocks for more efficient updates.
*   **[svelte5-await-block.md](svelte5-await-block.md)**: Explains how to handle promises in the markup using `{#await ...}` blocks to render different content based on the promise's state (pending, fulfilled, or rejected).
*   **[svelte5-key-block.md](svelte5-key-block.md)**: Describes the `{#key ...}` block, which destroys and recreates its contents when the value of an expression changes, useful for re-running transitions or re-initializing components.
