<script lang="ts">
	import { onMount } from 'svelte';
	import type { NavItem } from '../../types/navigation.js';
	import { getNavItemActiveState } from '../utils/navigation.js';
	import { initializeResponsive } from '../utils/responsive.js';
	import {
		navigationStore,
		navigationState,
		expandedMobileSections,
		mobileSections,
		screenReaderAnnouncement
	} from '../stores/navigation.js';

	/**
	 * Hierarchical navigation data structure with Topics and Cats grouped,
	 * Substack Galaxy as featured top-level item
	 */
	const navItems: NavItem[] = [
		{ href: '/', label: 'Home' },
		{ href: '/engagement', label: 'Engagement', featured: true },
		{
			label: 'Topics',
			children: [
				{ href: '/topic-explorer', label: 'Topic Explorer', featured: true },
				{ href: '/topics', label: 'Topics Overview' }
			]
		},
		{
			label: 'Cats',
			children: [
				{ href: '/cats', label: 'Cats Dashboard', featured: true },
				{ href: '/graph/cats', label: 'Cats Graph' }
			]
		},
		{ href: '/graph/recommendation-map', label: 'Substack Galaxy', featured: true },
		{ href: 'https://substack.com/@blaustrom', label: 'Follow me', external: true }
	];

	// Navigation state is now managed by the store

	// All navigation functions are now handled by the store

	/**
	 * Enhanced navigation item active state detection
	 * Uses the utility functions for comprehensive active state handling
	 */
	function getItemActiveState(item: NavItem, currentPath: string) {
		return getNavItemActiveState(item, currentPath);
	}

	/**
	 * Simplified active check for template usage
	 */
	function isItemActive(item: NavItem, currentPath: string): boolean {
		return getItemActiveState(item, currentPath).isActive;
	}

	/**
	 * Handle keyboard navigation for dropdown menus
	 */
	function handleDropdownKeydown(event: KeyboardEvent, itemLabel: string) {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				navigationStore.handleDropdownClick(itemLabel);
				break;
			case 'Escape':
				event.preventDefault();
				navigationStore.setActiveDropdown(null);
				// Return focus to the trigger button
				const trigger = event.target as HTMLElement;
				trigger.focus();
				break;
			case 'ArrowDown':
				event.preventDefault();
				// Focus first menu item
				const dropdown = (event.target as HTMLElement).parentElement?.querySelector(
					'[role="menu"]'
				);
				const firstMenuItem = dropdown?.querySelector('a') as HTMLElement;
				firstMenuItem?.focus();
				break;
		}
	}

	/**
	 * Handle keyboard navigation within dropdown menu items
	 */
	function handleMenuItemKeydown(event: KeyboardEvent, itemLabel: string) {
		const menuItems = Array.from(
			(event.target as HTMLElement).closest('[role="menu"]')?.querySelectorAll('a') || []
		) as HTMLElement[];
		const currentIndex = menuItems.indexOf(event.target as HTMLElement);

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				const nextIndex = (currentIndex + 1) % menuItems.length;
				menuItems[nextIndex]?.focus();
				break;
			case 'ArrowUp':
				event.preventDefault();
				const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
				menuItems[prevIndex]?.focus();
				break;
			case 'Escape':
				event.preventDefault();
				navigationStore.setActiveDropdown(null);
				// Return focus to the trigger button
				const trigger = (event.target as HTMLElement)
					.closest('.dropdown-container')
					?.querySelector('button') as HTMLElement;
				trigger?.focus();
				break;
			case 'Tab':
				// Allow natural tab behavior but close dropdown
				navigationStore.setActiveDropdown(null);
				break;
		}
	}

	/**
	 * Handle keyboard navigation for mobile section headers
	 */
	function handleMobileSectionKeydown(event: KeyboardEvent, itemLabel: string) {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				mobileSections.toggle(itemLabel);
				break;
		}
	}

	// Initialize responsive behavior and event handlers
	onMount(() => {
		// Initialize responsive tracking
		const cleanupResponsive = initializeResponsive();

		// Add outside click handler
		const handleClick = (event: MouseEvent) => navigationStore.handleOutsideClick(event);
		window.addEventListener('click', handleClick);

		return () => {
			// Cleanup responsive tracking
			if (cleanupResponsive) {
				cleanupResponsive();
			}

			// Remove click listener
			window.removeEventListener('click', handleClick);

			// Cleanup navigation store
			navigationStore.cleanup();
		};
	});
</script>

<nav class="relative z-50 w-full">
	<!-- Screen reader announcement region -->
	<div class="sr-only" aria-live="polite" aria-atomic="true" role="status">
		{$screenReaderAnnouncement}
	</div>

	<div class="container mx-auto flex items-center justify-between p-4">
		<a href="/" class="h4 font-bold text-primary-600-400">subboom!</a>

		<!-- Desktop Navigation -->
		<nav class="hidden items-center gap-4 md:flex" aria-label="Main navigation">
			{#each navItems as item}
				{#if item.href}
					<!-- Direct navigation item -->
					<a
						href={item.href}
						class="btn transition-all duration-200 {isItemActive(item, $navigationState.currentPath)
							? 'preset-filled-primary-500'
							: 'preset-tonal-surface'}"
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
						aria-current={isItemActive(item, $navigationState.currentPath) ? 'page' : undefined}
					>
						{#if item.external && item.label === 'Follow me'}
							<img src="/substack.png" alt="Substack" class="h-5 w-5" />
						{/if}
						{item.label}
					</a>
				{:else if item.children}
					<!-- Grouped navigation item with dropdown -->
					<div
						class="dropdown-container relative z-50"
						role="group"
						aria-label="{item.label} navigation group"
						onmouseenter={() => navigationStore.handleDropdownHover(item.label, true)}
						onmouseleave={() => navigationStore.handleDropdownHover(item.label, false)}
					>
						<button
							class="btn transition-all duration-200 {isItemActive(
								item,
								$navigationState.currentPath
							)
								? 'preset-filled-primary-500'
								: 'preset-tonal-surface'} flex items-center gap-1"
							onclick={() => navigationStore.handleDropdownClick(item.label)}
							onkeydown={(e) => handleDropdownKeydown(e, item.label)}
							aria-expanded={$navigationState.activeDropdown === item.label}
							aria-haspopup="menu"
							aria-controls="dropdown-menu-{item.label}"
							aria-label="{item.label} menu"
						>
							{item.label}
							<!-- Chevron down icon -->
							<svg
								class="h-4 w-4 transition-transform duration-200 {$navigationState.activeDropdown ===
								item.label
									? 'rotate-180'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						<!-- Dropdown content -->
						{#if $navigationState.dropdownsEnabled && $navigationState.activeDropdown === item.label}
							<div
								id="dropdown-menu-{item.label}"
								class="rounded-container-token absolute top-full left-0 z-[9999] mt-1 min-w-48 border border-surface-400-600 bg-surface-200-800 py-2 shadow-xl transition-all duration-200 ease-out"
								role="menu"
								aria-labelledby="dropdown-trigger-{item.label}"
								tabindex="-1"
								onmouseenter={() => navigationStore.handleDropdownHover(item.label, true)}
								onmouseleave={() => navigationStore.handleDropdownHover(item.label, false)}
							>
								{#each item.children as child}
									<a
										href={child.href}
										class="rounded-token block px-4 py-2 text-sm transition-all duration-150 {isItemActive(
											child,
											$navigationState.currentPath
										)
											? 'preset-filled-primary-500'
											: 'text-surface-900-50-token hover:preset-tonal-surface'}"
										role="menuitem"
										tabindex="-1"
										aria-current={isItemActive(child, $navigationState.currentPath)
											? 'page'
											: undefined}
										onclick={() => navigationStore.setActiveDropdown(null)}
										onkeydown={(e) => handleMenuItemKeydown(e, item.label)}
									>
										{child.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</nav>

		<!-- Mobile Hamburger Button -->
		<button
			class="btn preset-tonal-surface p-2 md:hidden"
			onclick={navigationStore.toggleMobileMenu}
			aria-label="{$navigationState.mobileMenuOpen ? 'Close' : 'Open'} navigation menu"
			aria-expanded={$navigationState.mobileMenuOpen}
			aria-controls="mobile-navigation-menu"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={$navigationState.mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
				/>
			</svg>
		</button>
	</div>

	<!-- Mobile Navigation Menu -->
	{#if $navigationState.isMobileMode && $navigationState.mobileMenuOpen}
		<nav
			id="mobile-navigation-menu"
			class="border-t border-surface-300-700 bg-surface-100-900 md:hidden"
			aria-label="Mobile navigation"
		>
			<div class="container mx-auto space-y-2 p-4">
				{#each navItems as item}
					{#if item.href}
						<!-- Direct navigation item -->
						<a
							href={item.href}
							class="btn w-full text-left {isItemActive(item, $navigationState.currentPath)
								? 'preset-filled-primary-500'
								: 'preset-tonal-surface'}"
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
							aria-current={isItemActive(item, $navigationState.currentPath) ? 'page' : undefined}
							onclick={navigationStore.closeMobileMenu}
						>
							{#if item.external && item.label === 'Follow me'}
								<img src="/substack.png" alt="Substack" class="h-5 w-5" />
							{/if}
							{item.label}
						</a>
					{:else if item.children}
						<!-- Mobile expandable navigation section -->
						<div class="space-y-1">
							<button
								class="btn flex w-full items-center justify-between preset-tonal-surface text-left font-semibold {isItemActive(
									item,
									$navigationState.currentPath
								)
									? 'preset-filled-primary-500'
									: 'preset-tonal-surface'}"
								onclick={() => mobileSections.toggle(item.label)}
								onkeydown={(e) => handleMobileSectionKeydown(e, item.label)}
								aria-expanded={mobileSections.isExpanded(item.label, $expandedMobileSections)}
								aria-controls="mobile-section-{item.label}"
								aria-label="{mobileSections.isExpanded(item.label, $expandedMobileSections)
									? 'Collapse'
									: 'Expand'} {item.label} section"
							>
								<span>{item.label}</span>
								<!-- Expand/collapse icon -->
								<svg
									class="h-4 w-4 transition-transform duration-200 {mobileSections.isExpanded(
										item.label,
										$expandedMobileSections
									)
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							<!-- Expandable child items with visual hierarchy -->
							{#if mobileSections.isExpanded(item.label, $expandedMobileSections)}
								<div
									id="mobile-section-{item.label}"
									class="mt-2 ml-2 space-y-1 border-l-2 border-primary-500 pl-4"
									role="group"
									aria-labelledby="mobile-section-header-{item.label}"
								>
									{#each item.children as child}
										<a
											href={child.href}
											class="btn w-full text-left {isItemActive(child, $navigationState.currentPath)
												? 'preset-filled-primary-500'
												: 'preset-tonal-surface'}"
											aria-current={isItemActive(child, $navigationState.currentPath)
												? 'page'
												: undefined}
											onclick={navigationStore.closeMobileMenu}
										>
											{child.label}
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</nav>
	{/if}
</nav>
