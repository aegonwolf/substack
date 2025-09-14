/**
 * Navigation item interface supporting hierarchical structure
 */
export interface NavItem {
	/** URL path for direct navigation items */
	href?: string;
	/** Display label for the navigation item */
	label: string;
	/** Child navigation items for grouped/dropdown navigation */
	children?: NavItem[];
	/** Whether this is an external link */
	external?: boolean;
	/** Icon identifier for the navigation item */
	icon?: string;
	/** Whether this item should be visually highlighted as featured/primary */
	featured?: boolean;
}

/**
 * Navigation state management interface
 */
export interface NavigationState {
	/** Whether the mobile menu is currently open */
	mobileMenuOpen: boolean;
	/** Currently active dropdown (desktop) - null if none active */
	activeDropdown: string | null;
	/** Current page path for active state detection */
	currentPath: string;
	/** Whether we're currently in mobile navigation mode */
	isMobileMode: boolean;
	/** Whether dropdown functionality should be enabled */
	dropdownsEnabled: boolean;
}

/**
 * Dropdown state management for desktop navigation
 */
export interface DropdownState {
	/** Mapping of dropdown identifiers to their open/closed state */
	[key: string]: boolean;
}

/**
 * Configuration for active state detection
 */
export interface ActiveStateConfig {
	/** Whether to match the path exactly */
	exactMatch: boolean;
	/** Path prefix to match against */
	pathPrefix?: string;
	/** Array of child paths that should activate this nav item */
	childPaths?: string[];
}

/**
 * Navigation component props interface
 */
export interface NavigationProps {
	/** Current page path for highlighting active items */
	currentPath: string;
	/** Whether the mobile menu is open */
	mobileMenuOpen: boolean;
}