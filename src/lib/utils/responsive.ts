import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Responsive breakpoint configuration matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Current screen size state
 */
export interface ScreenSize {
	width: number;
	height: number;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	currentBreakpoint: BreakpointKey | 'xs';
}

/**
 * Create initial screen size state
 */
function createInitialScreenSize(): ScreenSize {
	if (!browser) {
		// Server-side rendering defaults
		return {
			width: 1024,
			height: 768,
			isMobile: false,
			isTablet: false,
			isDesktop: true,
			currentBreakpoint: 'lg'
		};
	}

	const width = window.innerWidth;
	const height = window.innerHeight;

	return {
		width,
		height,
		isMobile: width < BREAKPOINTS.md,
		isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
		isDesktop: width >= BREAKPOINTS.lg,
		currentBreakpoint: getCurrentBreakpoint(width)
	};
}

/**
 * Determine current breakpoint based on screen width
 */
function getCurrentBreakpoint(width: number): BreakpointKey | 'xs' {
	if (width >= BREAKPOINTS['2xl']) return '2xl';
	if (width >= BREAKPOINTS.xl) return 'xl';
	if (width >= BREAKPOINTS.lg) return 'lg';
	if (width >= BREAKPOINTS.md) return 'md';
	if (width >= BREAKPOINTS.sm) return 'sm';
	return 'xs';
}

/**
 * Update screen size state based on current window dimensions
 */
function updateScreenSize(): ScreenSize {
	if (!browser) return createInitialScreenSize();

	const width = window.innerWidth;
	const height = window.innerHeight;

	return {
		width,
		height,
		isMobile: width < BREAKPOINTS.md,
		isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
		isDesktop: width >= BREAKPOINTS.lg,
		currentBreakpoint: getCurrentBreakpoint(width)
	};
}

/**
 * Reactive store for screen size information
 */
export const screenSize = writable<ScreenSize>(createInitialScreenSize());

/**
 * Initialize responsive behavior tracking
 * Should be called once in the app lifecycle
 */
export function initializeResponsive() {
	if (!browser) return;

	// Update screen size on window resize
	const handleResize = () => {
		screenSize.set(updateScreenSize());
	};

	// Set initial size
	screenSize.set(updateScreenSize());

	// Add resize listener
	window.addEventListener('resize', handleResize);

	// Return cleanup function
	return () => {
		window.removeEventListener('resize', handleResize);
	};
}

/**
 * Check if current screen size matches a specific breakpoint or condition
 */
export function matchesBreakpoint(condition: BreakpointKey | 'mobile' | 'tablet' | 'desktop'): boolean {
	if (!browser) return false;

	const current = updateScreenSize();

	switch (condition) {
		case 'mobile':
			return current.isMobile;
		case 'tablet':
			return current.isTablet;
		case 'desktop':
			return current.isDesktop;
		default:
			return current.width >= BREAKPOINTS[condition];
	}
}

/**
 * Utility function to check if dropdowns should be enabled
 * Dropdowns are only enabled on desktop sizes (lg and above)
 */
export function shouldEnableDropdowns(): boolean {
	return matchesBreakpoint('desktop');
}

/**
 * Utility function to check if mobile navigation should be used
 */
export function shouldUseMobileNavigation(): boolean {
	return matchesBreakpoint('mobile');
}