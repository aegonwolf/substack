import { writable, derived, get } from 'svelte/store';
import { page } from '$app/stores';
import { screenSize } from '../utils/responsive.js';
import type { NavigationState } from '../../types/navigation.js';

/**
 * Screen reader announcement store for accessibility
 */
export const screenReaderAnnouncement = writable<string>('');

/**
 * Announce text to screen readers
 */
function announceToScreenReader(message: string) {
	screenReaderAnnouncement.set(message);
	// Clear the announcement after a short delay to allow screen readers to read it
	setTimeout(() => {
		screenReaderAnnouncement.set('');
	}, 1000);
}

/**
 * Mobile section expansion state
 */
export const expandedMobileSections = writable<{ [key: string]: boolean }>({});

/**
 * Dropdown timeout tracking for cleanup
 */
let dropdownTimeouts: { [key: string]: number } = {};

/**
 * Core navigation state store
 */
function createNavigationStore() {
	const { subscribe, set, update } = writable<NavigationState>({
		mobileMenuOpen: false,
		activeDropdown: null,
		currentPath: '/',
		isMobileMode: false,
		dropdownsEnabled: true
	});

	return {
		subscribe,
		set,
		update,

		/**
		 * Toggle mobile menu open/closed
		 */
		toggleMobileMenu: () => {
			update(state => {
				const newState = {
					...state,
					mobileMenuOpen: !state.mobileMenuOpen
				};
				
				// Announce state change to screen readers
				announceToScreenReader(
					newState.mobileMenuOpen ? 'Navigation menu opened' : 'Navigation menu closed'
				);
				
				return newState;
			});
		},

		/**
		 * Close mobile menu
		 */
		closeMobileMenu: () => {
			update(state => ({
				...state,
				mobileMenuOpen: false
			}));
		},

		/**
		 * Set active dropdown (desktop only)
		 */
		setActiveDropdown: (dropdownId: string | null) => {
			update(state => {
				// Only allow dropdown changes if dropdowns are enabled
				if (!state.dropdownsEnabled) {
					return state;
				}
				
				const newState = {
					...state,
					activeDropdown: dropdownId
				};
				
				// Announce dropdown state changes to screen readers
				if (dropdownId && dropdownId !== state.activeDropdown) {
					announceToScreenReader(`${dropdownId} menu opened`);
				} else if (!dropdownId && state.activeDropdown) {
					announceToScreenReader(`${state.activeDropdown} menu closed`);
				}
				
				return newState;
			});
		},

		/**
		 * Handle dropdown hover with timeout management
		 */
		handleDropdownHover: (itemLabel: string, isEntering: boolean) => {
			const currentState = get(navigationStore);
			
			// Only handle hover if dropdowns are enabled
			if (!currentState.dropdownsEnabled) {
				return;
			}

			// Clear any existing timeout for this dropdown
			if (dropdownTimeouts[itemLabel]) {
				clearTimeout(dropdownTimeouts[itemLabel]);
				delete dropdownTimeouts[itemLabel];
			}

			if (isEntering) {
				// Open dropdown immediately on hover
				navigationStore.setActiveDropdown(itemLabel);
			} else {
				// Delay closing dropdown to prevent accidental closes
				dropdownTimeouts[itemLabel] = window.setTimeout(() => {
					const state = get(navigationStore);
					if (state.activeDropdown === itemLabel) {
						navigationStore.setActiveDropdown(null);
					}
					delete dropdownTimeouts[itemLabel];
				}, 300);
			}
		},

		/**
		 * Handle dropdown click for touch devices
		 */
		handleDropdownClick: (itemLabel: string) => {
			const currentState = get(navigationStore);
			
			// Only handle click if dropdowns are enabled
			if (!currentState.dropdownsEnabled) {
				return;
			}

			if (currentState.activeDropdown === itemLabel) {
				navigationStore.setActiveDropdown(null);
			} else {
				navigationStore.setActiveDropdown(itemLabel);
				
				// Focus first menu item when dropdown opens via click
				setTimeout(() => {
					const dropdown = document.querySelector(`#dropdown-menu-${itemLabel}`);
					const firstMenuItem = dropdown?.querySelector('a') as HTMLElement;
					firstMenuItem?.focus();
				}, 50);
			}
		},

		/**
		 * Handle outside click to close dropdowns
		 */
		handleOutsideClick: (event: MouseEvent) => {
			const currentState = get(navigationStore);
			
			if (!currentState.dropdownsEnabled) {
				return;
			}

			const target = event.target as Element;
			if (!target.closest('.dropdown-container')) {
				navigationStore.setActiveDropdown(null);
			}
		},

		/**
		 * Update responsive mode and cleanup state as needed
		 */
		updateResponsiveMode: (isMobile: boolean, dropdownsEnabled: boolean) => {
			update(state => {
				const wasMobileMode = state.isMobileMode;
				const wasDropdownsEnabled = state.dropdownsEnabled;

				// Create new state with updated responsive flags
				const newState = {
					...state,
					isMobileMode: isMobile,
					dropdownsEnabled
				};

				// Cleanup when switching from desktop to mobile
				if (wasDropdownsEnabled && !dropdownsEnabled) {
					newState.activeDropdown = null;
					// Clear any pending dropdown timeouts
					Object.values(dropdownTimeouts).forEach(timeout => clearTimeout(timeout));
					dropdownTimeouts = {};
				}

				// Close mobile menu when switching from mobile to desktop
				if (wasMobileMode && !isMobile) {
					newState.mobileMenuOpen = false;
					// Reset mobile sections
					expandedMobileSections.set({});
				}

				return newState;
			});
		},

		/**
		 * Update current path
		 */
		updateCurrentPath: (path: string) => {
			update(state => ({
				...state,
				currentPath: path
			}));
		},

		/**
		 * Cleanup function for timeouts and event listeners
		 */
		cleanup: () => {
			// Clear all pending dropdown timeouts
			Object.values(dropdownTimeouts).forEach(timeout => clearTimeout(timeout));
			dropdownTimeouts = {};
		}
	};
}

/**
 * Main navigation store instance
 */
export const navigationStore = createNavigationStore();

/**
 * Derived store that automatically updates navigation state based on page and screen size changes
 */
export const navigationState = derived(
	[navigationStore, page, screenSize],
	([$navigationStore, $page, $screenSize]) => {
		// Update responsive mode
		const isMobile = $screenSize.isMobile;
		const dropdownsEnabled = $screenSize.isDesktop;
		
		// Update navigation store if responsive state changed
		if ($navigationStore.isMobileMode !== isMobile || $navigationStore.dropdownsEnabled !== dropdownsEnabled) {
			navigationStore.updateResponsiveMode(isMobile, dropdownsEnabled);
		}

		// Update current path if it changed
		const currentPath = $page.url.pathname;
		if ($navigationStore.currentPath !== currentPath) {
			navigationStore.updateCurrentPath(currentPath);
		}

		return $navigationStore;
	}
);

/**
 * Mobile section management utilities
 */
export const mobileSections = {
	/**
	 * Toggle mobile section expansion
	 */
	toggle: (sectionLabel: string) => {
		expandedMobileSections.update(sections => {
			const newSections = {
				...sections,
				[sectionLabel]: !sections[sectionLabel]
			};
			
			// Announce section state change to screen readers
			announceToScreenReader(
				newSections[sectionLabel] 
					? `${sectionLabel} section expanded` 
					: `${sectionLabel} section collapsed`
			);
			
			return newSections;
		});
	},

	/**
	 * Check if section is expanded
	 */
	isExpanded: (sectionLabel: string, sections: { [key: string]: boolean }): boolean => {
		return sections[sectionLabel] || false;
	},

	/**
	 * Reset all sections
	 */
	reset: () => {
		expandedMobileSections.set({});
	}
};