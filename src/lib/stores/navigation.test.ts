import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { navigationStore, expandedMobileSections, mobileSections } from './navigation.js';

// Mock the responsive utilities
vi.mock('../utils/responsive.js', () => ({
	initializeResponsive: vi.fn(() => vi.fn()),
	screenSize: {
		subscribe: vi.fn()
	}
}));

// Mock the page store
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	}
}));

describe('Navigation Store', () => {
	beforeEach(() => {
		// Reset navigation store to initial state
		navigationStore.set({
			mobileMenuOpen: false,
			activeDropdown: null,
			currentPath: '/',
			isMobileMode: false,
			dropdownsEnabled: true
		});
		
		// Reset mobile sections
		expandedMobileSections.set({});
	});

	describe('Mobile Menu Management', () => {
		it('should toggle mobile menu open/closed', () => {
			const initialState = get(navigationStore);
			expect(initialState.mobileMenuOpen).toBe(false);

			navigationStore.toggleMobileMenu();
			const afterToggle = get(navigationStore);
			expect(afterToggle.mobileMenuOpen).toBe(true);

			navigationStore.toggleMobileMenu();
			const afterSecondToggle = get(navigationStore);
			expect(afterSecondToggle.mobileMenuOpen).toBe(false);
		});

		it('should close mobile menu', () => {
			// First open the menu
			navigationStore.toggleMobileMenu();
			expect(get(navigationStore).mobileMenuOpen).toBe(true);

			// Then close it
			navigationStore.closeMobileMenu();
			expect(get(navigationStore).mobileMenuOpen).toBe(false);
		});
	});

	describe('Dropdown Management', () => {
		it('should set active dropdown when dropdowns are enabled', () => {
			navigationStore.setActiveDropdown('Topics');
			const state = get(navigationStore);
			expect(state.activeDropdown).toBe('Topics');
		});

		it('should not set active dropdown when dropdowns are disabled', () => {
			// Disable dropdowns
			navigationStore.updateResponsiveMode(true, false);
			
			navigationStore.setActiveDropdown('Topics');
			const state = get(navigationStore);
			expect(state.activeDropdown).toBe(null);
		});

		it('should handle dropdown click toggle', () => {
			// First click should open dropdown
			navigationStore.handleDropdownClick('Topics');
			expect(get(navigationStore).activeDropdown).toBe('Topics');

			// Second click should close dropdown
			navigationStore.handleDropdownClick('Topics');
			expect(get(navigationStore).activeDropdown).toBe(null);
		});

		it('should not handle dropdown click when dropdowns disabled', () => {
			// Disable dropdowns
			navigationStore.updateResponsiveMode(true, false);
			
			navigationStore.handleDropdownClick('Topics');
			expect(get(navigationStore).activeDropdown).toBe(null);
		});
	});

	describe('Responsive Mode Management', () => {
		it('should update responsive mode flags', () => {
			navigationStore.updateResponsiveMode(true, false);
			const state = get(navigationStore);
			
			expect(state.isMobileMode).toBe(true);
			expect(state.dropdownsEnabled).toBe(false);
		});

		it('should close dropdowns when switching to mobile mode', () => {
			// Set up desktop mode with active dropdown
			navigationStore.setActiveDropdown('Topics');
			expect(get(navigationStore).activeDropdown).toBe('Topics');

			// Switch to mobile mode
			navigationStore.updateResponsiveMode(true, false);
			const state = get(navigationStore);
			
			expect(state.activeDropdown).toBe(null);
			expect(state.dropdownsEnabled).toBe(false);
		});

		it('should close mobile menu when switching to desktop mode', () => {
			// Set up mobile mode with open menu
			navigationStore.updateResponsiveMode(true, false);
			navigationStore.toggleMobileMenu();
			expect(get(navigationStore).mobileMenuOpen).toBe(true);

			// Switch to desktop mode
			navigationStore.updateResponsiveMode(false, true);
			const state = get(navigationStore);
			
			expect(state.mobileMenuOpen).toBe(false);
			expect(state.isMobileMode).toBe(false);
		});
	});

	describe('Mobile Sections Management', () => {
		it('should toggle mobile section expansion', () => {
			const initialSections = get(expandedMobileSections);
			expect(mobileSections.isExpanded('Topics', initialSections)).toBe(false);

			mobileSections.toggle('Topics');
			const afterToggle = get(expandedMobileSections);
			expect(mobileSections.isExpanded('Topics', afterToggle)).toBe(true);

			mobileSections.toggle('Topics');
			const afterSecondToggle = get(expandedMobileSections);
			expect(mobileSections.isExpanded('Topics', afterSecondToggle)).toBe(false);
		});

		it('should reset all mobile sections', () => {
			// Expand some sections
			mobileSections.toggle('Topics');
			mobileSections.toggle('Cats');
			
			let sections = get(expandedMobileSections);
			expect(mobileSections.isExpanded('Topics', sections)).toBe(true);
			expect(mobileSections.isExpanded('Cats', sections)).toBe(true);

			// Reset all sections
			mobileSections.reset();
			sections = get(expandedMobileSections);
			expect(mobileSections.isExpanded('Topics', sections)).toBe(false);
			expect(mobileSections.isExpanded('Cats', sections)).toBe(false);
		});
	});

	describe('Path Management', () => {
		it('should update current path', () => {
			navigationStore.updateCurrentPath('/engagement');
			const state = get(navigationStore);
			expect(state.currentPath).toBe('/engagement');
		});
	});
});