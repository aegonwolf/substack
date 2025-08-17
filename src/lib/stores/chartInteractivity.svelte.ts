import type { CategoryStatistics } from '../../routes/cats/+page.server';

interface TooltipState {
	visible: boolean;
	x: number;
	y: number;
	statistics: CategoryStatistics | null;
}

interface InteractivityState {
	hoveredCategory: string | null;
	selectedCategory: string | null;
	tooltip: TooltipState;
}

// Shared state for chart interactivity
export const chartState = $state<InteractivityState>({
	hoveredCategory: null,
	selectedCategory: null,
	tooltip: {
		visible: false,
		x: 0,
		y: 0,
		statistics: null
	}
});

// Actions for updating state
export function setHoveredCategory(category: string | null, statistics: CategoryStatistics | null, event?: MouseEvent) {
	chartState.hoveredCategory = category;
	
	if (category && statistics && event) {
		chartState.tooltip = {
			visible: true,
			x: event.clientX,
			y: event.clientY,
			statistics
		};
	} else {
		chartState.tooltip.visible = false;
		chartState.tooltip.statistics = null;
	}
}

export function setSelectedCategory(category: string | null) {
	chartState.selectedCategory = category;
}

export function clearTooltip() {
	chartState.tooltip.visible = false;
	chartState.tooltip.statistics = null;
	chartState.hoveredCategory = null;
}