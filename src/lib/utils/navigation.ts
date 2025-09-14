import type { NavItem, ActiveStateConfig } from '../../types/navigation.js';

/**
 * Enhanced active state detection for hierarchical navigation
 * Handles both direct navigation items and grouped items with children
 */
export function isNavItemActive(
	item: NavItem, 
	currentPath: string, 
	config: ActiveStateConfig = { exactMatch: false }
): boolean {
	// Handle direct navigation items
	if (item.href) {
		// Clean the current path by removing query parameters and fragments
		const cleanCurrentPath = currentPath.split(/[?#]/)[0];
		
		if (config.exactMatch) {
			return cleanCurrentPath === item.href;
		}
		
		// For non-exact matching, handle root path specially
		if (item.href === '/') {
			return cleanCurrentPath === '/';
		}
		
		// Check if current path matches exactly or is a sub-route
		// Ensure we don't match similar paths like /engagement-test when looking for /engagement
		return cleanCurrentPath === item.href || cleanCurrentPath.startsWith(item.href + '/');
	}
	
	// Handle grouped navigation items (items with children)
	if (item.children && item.children.length > 0) {
		// A parent item is active if any of its children are active
		return item.children.some(child => isNavItemActive(child, currentPath, config));
	}
	
	return false;
}

/**
 * Determines if a parent navigation item should be highlighted
 * based on the current path and its children's paths
 */
export function isParentNavItemActive(item: NavItem, currentPath: string): boolean {
	if (!item.children || item.children.length === 0) {
		return false;
	}
	
	// Clean the current path by removing query parameters and fragments
	const cleanCurrentPath = currentPath.split(/[?#]/)[0];
	
	// Check if any child item matches the current path
	return item.children.some(child => {
		if (!child.href) return false;
		
		// Exact match for child paths
		if (cleanCurrentPath === child.href) {
			return true;
		}
		
		// Handle nested routes under child paths
		// For example, /topic-explorer/some-topic should activate the Topics parent
		// Ensure we don't match similar paths like /topic-explorer-new
		if (child.href !== '/' && cleanCurrentPath.startsWith(child.href + '/')) {
			return true;
		}
		
		return false;
	});
}

/**
 * Gets the active child item for a parent navigation item
 * Returns the child item that matches the current path, or null if none match
 */
export function getActiveChildItem(item: NavItem, currentPath: string): NavItem | null {
	if (!item.children || item.children.length === 0) {
		return null;
	}
	
	// Clean the current path by removing query parameters and fragments
	const cleanCurrentPath = currentPath.split(/[?#]/)[0];
	
	// Find the child that matches the current path
	for (const child of item.children) {
		if (!child.href) continue;
		
		// Exact match
		if (cleanCurrentPath === child.href) {
			return child;
		}
		
		// Handle nested routes under child paths
		// Ensure we don't match similar paths by requiring a slash separator
		if (child.href !== '/' && cleanCurrentPath.startsWith(child.href + '/')) {
			return child;
		}
	}
	
	return null;
}

/**
 * Comprehensive active state detection that handles all navigation scenarios
 * This is the main function to use for determining if any nav item should be highlighted
 */
export function getNavItemActiveState(item: NavItem, currentPath: string): {
	isActive: boolean;
	isParentActive: boolean;
	activeChild: NavItem | null;
} {
	// Direct navigation item
	if (item.href) {
		// Clean the current path by removing query parameters and fragments
		const cleanCurrentPath = currentPath.split(/[?#]/)[0];
		
		const isActive = item.href === '/' 
			? cleanCurrentPath === '/' 
			: cleanCurrentPath === item.href || (item.href !== '/' && cleanCurrentPath.startsWith(item.href + '/'));
			
		return {
			isActive,
			isParentActive: false,
			activeChild: null
		};
	}
	
	// Grouped navigation item
	if (item.children && item.children.length > 0) {
		const activeChild = getActiveChildItem(item, currentPath);
		const isParentActive = activeChild !== null;
		
		return {
			isActive: isParentActive,
			isParentActive,
			activeChild
		};
	}
	
	return {
		isActive: false,
		isParentActive: false,
		activeChild: null
	};
}

/**
 * Helper function to handle edge cases in route matching
 */
export function normalizePathForComparison(path: string): string {
	// Remove trailing slashes except for root
	if (path !== '/' && path.endsWith('/')) {
		return path.slice(0, -1);
	}
	return path;
}

/**
 * Advanced route matching that handles query parameters and fragments
 */
export function matchesRoute(itemPath: string, currentPath: string, includeQueryParams = false): boolean {
	if (!itemPath) return false;
	
	// Normalize paths
	const normalizedItemPath = normalizePathForComparison(itemPath);
	let normalizedCurrentPath = normalizePathForComparison(currentPath);
	
	// Remove query parameters and fragments if not including them
	if (!includeQueryParams) {
		const urlParts = normalizedCurrentPath.split(/[?#]/);
		normalizedCurrentPath = urlParts[0];
	}
	
	// Handle root path specially
	if (normalizedItemPath === '/') {
		return normalizedCurrentPath === '/';
	}
	
	// Exact match
	if (normalizedCurrentPath === normalizedItemPath) {
		return true;
	}
	
	// Check if current path is a sub-route of the item path
	// Ensure we don't match similar paths by requiring a slash separator
	return normalizedCurrentPath.startsWith(normalizedItemPath + '/');
}