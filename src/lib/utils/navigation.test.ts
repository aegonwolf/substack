import { describe, it, expect } from 'vitest';
import {
	isNavItemActive,
	isParentNavItemActive,
	getActiveChildItem,
	getNavItemActiveState,
	normalizePathForComparison,
	matchesRoute
} from './navigation.js';
import type { NavItem } from '../../types/navigation.js';

// Test data matching the actual navigation structure
const testNavItems: NavItem[] = [
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

describe('Navigation Active State Detection', () => {
	describe('isNavItemActive', () => {
		it('should detect active state for direct navigation items', () => {
			const homeItem = testNavItems[0];
			const engagementItem = testNavItems[1];
			
			expect(isNavItemActive(homeItem, '/')).toBe(true);
			expect(isNavItemActive(homeItem, '/engagement')).toBe(false);
			expect(isNavItemActive(engagementItem, '/engagement')).toBe(true);
			expect(isNavItemActive(engagementItem, '/')).toBe(false);
		});

		it('should detect active state for nested routes under direct items', () => {
			const engagementItem = testNavItems[1];
			
			expect(isNavItemActive(engagementItem, '/engagement/some-sub-page')).toBe(true);
			expect(isNavItemActive(engagementItem, '/engagement/deep/nested/route')).toBe(true);
		});

		it('should handle root path specially', () => {
			const homeItem = testNavItems[0];
			
			expect(isNavItemActive(homeItem, '/')).toBe(true);
			expect(isNavItemActive(homeItem, '/anything-else')).toBe(false);
		});

		it('should detect active state for grouped navigation items', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			expect(isNavItemActive(topicsGroup, '/topic-explorer')).toBe(true);
			expect(isNavItemActive(topicsGroup, '/topics')).toBe(true);
			expect(isNavItemActive(topicsGroup, '/engagement')).toBe(false);
			
			expect(isNavItemActive(catsGroup, '/cats')).toBe(true);
			expect(isNavItemActive(catsGroup, '/graph/cats')).toBe(true);
			expect(isNavItemActive(catsGroup, '/topics')).toBe(false);
		});

		it('should handle nested routes under grouped items', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			expect(isNavItemActive(topicsGroup, '/topic-explorer/some-topic')).toBe(true);
			expect(isNavItemActive(topicsGroup, '/topics/some-sub-page')).toBe(true);
			expect(isNavItemActive(catsGroup, '/cats/some-category')).toBe(true);
			expect(isNavItemActive(catsGroup, '/graph/cats/some-view')).toBe(true);
		});

		it('should handle exact matching when configured', () => {
			const engagementItem = testNavItems[1];
			
			expect(isNavItemActive(engagementItem, '/engagement', { exactMatch: true })).toBe(true);
			expect(isNavItemActive(engagementItem, '/engagement/sub-page', { exactMatch: true })).toBe(false);
		});
	});

	describe('isParentNavItemActive', () => {
		it('should return false for items without children', () => {
			const homeItem = testNavItems[0];
			const engagementItem = testNavItems[1];
			
			expect(isParentNavItemActive(homeItem, '/')).toBe(false);
			expect(isParentNavItemActive(engagementItem, '/engagement')).toBe(false);
		});

		it('should detect when parent should be active based on child routes', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			expect(isParentNavItemActive(topicsGroup, '/topic-explorer')).toBe(true);
			expect(isParentNavItemActive(topicsGroup, '/topics')).toBe(true);
			expect(isParentNavItemActive(topicsGroup, '/engagement')).toBe(false);
			
			expect(isParentNavItemActive(catsGroup, '/cats')).toBe(true);
			expect(isParentNavItemActive(catsGroup, '/graph/cats')).toBe(true);
			expect(isParentNavItemActive(catsGroup, '/topic-explorer')).toBe(false);
		});

		it('should handle nested routes under child items', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			expect(isParentNavItemActive(topicsGroup, '/topic-explorer/some-topic')).toBe(true);
			expect(isParentNavItemActive(topicsGroup, '/topics/overview')).toBe(true);
			expect(isParentNavItemActive(catsGroup, '/cats/category-1')).toBe(true);
			expect(isParentNavItemActive(catsGroup, '/graph/cats/network-view')).toBe(true);
		});
	});

	describe('getActiveChildItem', () => {
		it('should return null for items without children', () => {
			const homeItem = testNavItems[0];
			
			expect(getActiveChildItem(homeItem, '/')).toBeNull();
		});

		it('should return the correct active child item', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			const activeTopicChild = getActiveChildItem(topicsGroup, '/topic-explorer');
			expect(activeTopicChild?.href).toBe('/topic-explorer');
			expect(activeTopicChild?.label).toBe('Topic Explorer');
			
			const activeTopicsChild = getActiveChildItem(topicsGroup, '/topics');
			expect(activeTopicsChild?.href).toBe('/topics');
			expect(activeTopicsChild?.label).toBe('Topics Overview');
			
			const activeCatsChild = getActiveChildItem(catsGroup, '/cats');
			expect(activeCatsChild?.href).toBe('/cats');
			expect(activeCatsChild?.label).toBe('Cats Dashboard');
			
			const activeCatsGraphChild = getActiveChildItem(catsGroup, '/graph/cats');
			expect(activeCatsGraphChild?.href).toBe('/graph/cats');
			expect(activeCatsGraphChild?.label).toBe('Cats Graph');
		});

		it('should return correct child for nested routes', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			const activeChild1 = getActiveChildItem(topicsGroup, '/topic-explorer/some-topic');
			expect(activeChild1?.href).toBe('/topic-explorer');
			
			const activeChild2 = getActiveChildItem(catsGroup, '/graph/cats/some-view');
			expect(activeChild2?.href).toBe('/graph/cats');
		});

		it('should return null when no child matches', () => {
			const topicsGroup = testNavItems[2];
			
			expect(getActiveChildItem(topicsGroup, '/engagement')).toBeNull();
			expect(getActiveChildItem(topicsGroup, '/cats')).toBeNull();
		});
	});

	describe('getNavItemActiveState', () => {
		it('should provide comprehensive state for direct navigation items', () => {
			const homeItem = testNavItems[0];
			const engagementItem = testNavItems[1];
			
			const homeState = getNavItemActiveState(homeItem, '/');
			expect(homeState.isActive).toBe(true);
			expect(homeState.isParentActive).toBe(false);
			expect(homeState.activeChild).toBeNull();
			
			const engagementState = getNavItemActiveState(engagementItem, '/engagement');
			expect(engagementState.isActive).toBe(true);
			expect(engagementState.isParentActive).toBe(false);
			expect(engagementState.activeChild).toBeNull();
			
			const inactiveState = getNavItemActiveState(engagementItem, '/topics');
			expect(inactiveState.isActive).toBe(false);
			expect(inactiveState.isParentActive).toBe(false);
			expect(inactiveState.activeChild).toBeNull();
		});

		it('should provide comprehensive state for grouped navigation items', () => {
			const topicsGroup = testNavItems[2];
			
			const activeState = getNavItemActiveState(topicsGroup, '/topic-explorer');
			expect(activeState.isActive).toBe(true);
			expect(activeState.isParentActive).toBe(true);
			expect(activeState.activeChild?.href).toBe('/topic-explorer');
			
			const inactiveState = getNavItemActiveState(topicsGroup, '/engagement');
			expect(inactiveState.isActive).toBe(false);
			expect(inactiveState.isParentActive).toBe(false);
			expect(inactiveState.activeChild).toBeNull();
		});

		it('should handle nested routes correctly', () => {
			const topicsGroup = testNavItems[2];
			const catsGroup = testNavItems[3];
			
			const nestedTopicState = getNavItemActiveState(topicsGroup, '/topic-explorer/some-topic');
			expect(nestedTopicState.isActive).toBe(true);
			expect(nestedTopicState.isParentActive).toBe(true);
			expect(nestedTopicState.activeChild?.href).toBe('/topic-explorer');
			
			const nestedCatState = getNavItemActiveState(catsGroup, '/graph/cats/network');
			expect(nestedCatState.isActive).toBe(true);
			expect(nestedCatState.isParentActive).toBe(true);
			expect(nestedCatState.activeChild?.href).toBe('/graph/cats');
		});
	});

	describe('normalizePathForComparison', () => {
		it('should remove trailing slashes except for root', () => {
			expect(normalizePathForComparison('/')).toBe('/');
			expect(normalizePathForComparison('/engagement/')).toBe('/engagement');
			expect(normalizePathForComparison('/topic-explorer/')).toBe('/topic-explorer');
			expect(normalizePathForComparison('/path/with/multiple/slashes/')).toBe('/path/with/multiple/slashes');
		});

		it('should leave paths without trailing slashes unchanged', () => {
			expect(normalizePathForComparison('/engagement')).toBe('/engagement');
			expect(normalizePathForComparison('/topic-explorer')).toBe('/topic-explorer');
			expect(normalizePathForComparison('/path/without/slash')).toBe('/path/without/slash');
		});
	});

	describe('matchesRoute', () => {
		it('should handle exact route matching', () => {
			expect(matchesRoute('/engagement', '/engagement')).toBe(true);
			expect(matchesRoute('/topic-explorer', '/topic-explorer')).toBe(true);
			expect(matchesRoute('/engagement', '/topics')).toBe(false);
		});

		it('should handle sub-route matching', () => {
			expect(matchesRoute('/engagement', '/engagement/sub-page')).toBe(true);
			expect(matchesRoute('/topic-explorer', '/topic-explorer/some-topic')).toBe(true);
			expect(matchesRoute('/graph/cats', '/graph/cats/network-view')).toBe(true);
		});

		it('should handle root path specially', () => {
			expect(matchesRoute('/', '/')).toBe(true);
			expect(matchesRoute('/', '/engagement')).toBe(false);
			expect(matchesRoute('/', '/anything')).toBe(false);
		});

		it('should handle query parameters and fragments', () => {
			expect(matchesRoute('/engagement', '/engagement?param=value')).toBe(true);
			expect(matchesRoute('/engagement', '/engagement#section')).toBe(true);
			expect(matchesRoute('/engagement', '/engagement?param=value#section')).toBe(true);
			
			// When including query params
			expect(matchesRoute('/engagement', '/engagement?param=value', true)).toBe(false);
			expect(matchesRoute('/engagement?param=value', '/engagement?param=value', true)).toBe(true);
		});

		it('should handle trailing slashes', () => {
			expect(matchesRoute('/engagement/', '/engagement')).toBe(true);
			expect(matchesRoute('/engagement', '/engagement/')).toBe(true);
			expect(matchesRoute('/engagement/', '/engagement/')).toBe(true);
		});

		it('should return false for invalid paths', () => {
			expect(matchesRoute('', '/engagement')).toBe(false);
			expect(matchesRoute(undefined as any, '/engagement')).toBe(false);
		});
	});

	describe('Edge Cases and Real Route Testing', () => {
		it('should handle all existing application routes correctly', () => {
			const routes = [
				'/',
				'/engagement',
				'/topic-explorer',
				'/topics',
				'/cats',
				'/graph/cats',
				'/graph/recommendation-map',
				'/networks',
				'/color-scale-demo',
				'/lazy-test'
			];

			routes.forEach(route => {
				// Test that each route can be detected as active
				const matchingItems = testNavItems.filter(item => 
					isNavItemActive(item, route)
				);
				
				// Each route should match at least one nav item (except for routes not in nav)
				if (['/networks', '/color-scale-demo', '/lazy-test'].includes(route)) {
					// These routes are not in the main navigation
					expect(matchingItems.length).toBe(0);
				} else {
					expect(matchingItems.length).toBeGreaterThan(0);
				}
			});
		});

		it('should handle nested routes that might exist in the future', () => {
			const nestedRoutes = [
				'/engagement/analytics',
				'/engagement/reports/monthly',
				'/topic-explorer/technology',
				'/topic-explorer/science/ai',
				'/cats/programming',
				'/cats/science/data',
				'/graph/cats/force-directed',
				'/graph/recommendation-map/filtered'
			];

			nestedRoutes.forEach(route => {
				const matchingItems = testNavItems.filter(item => 
					isNavItemActive(item, route)
				);
				
				// Each nested route should match exactly one nav item
				expect(matchingItems.length).toBe(1);
			});
		});

		it('should not have false positives for similar paths', () => {
			// Test that similar but different paths don't incorrectly match
			expect(isNavItemActive(testNavItems[1], '/engagement-test')).toBe(false);
			expect(isNavItemActive(testNavItems[2], '/topic-explorer-new')).toBe(false);
			expect(isNavItemActive(testNavItems[3], '/cats-dashboard')).toBe(false);
		});

		it('should handle query parameters and fragments in real scenarios', () => {
			const routesWithParams = [
				'/engagement?filter=recent',
				'/topic-explorer?topic=technology#overview',
				'/cats?category=programming&sort=name',
				'/graph/cats?layout=force#settings'
			];

			routesWithParams.forEach(route => {
				const matchingItems = testNavItems.filter(item => 
					isNavItemActive(item, route)
				);
				
				expect(matchingItems.length).toBeGreaterThan(0);
			});
		});
	});
});