/**
 * Viewport dimension calculation utilities for responsive 3D graph sizing
 */

export interface ViewportDimensions {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
}

/**
 * Calculate optimal dimensions for the 3D graph based on current viewport
 * Accounts for header height, navigation, and padding while ensuring minimum viable dimensions
 */
export function calculateOptimalDimensions(): ViewportDimensions {
  // Get current viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Define space reservations for UI elements
  const headerHeight = 80; // Reserve space for header/navigation
  const horizontalPadding = 40; // Side padding for visual breathing room
  const verticalPadding = 20; // Top/bottom padding
  
  // Calculate available space after reserving for UI elements
  const availableWidth = viewportWidth - horizontalPadding;
  const availableHeight = viewportHeight - headerHeight - verticalPadding;
  
  // Set minimum viable dimensions as fallback for small screens
  const minWidth = 800;
  const minHeight = 600;
  
  // Ensure dimensions don't go below minimum viable size
  const finalWidth = Math.max(minWidth, availableWidth);
  const finalHeight = Math.max(minHeight, availableHeight);
  
  return {
    width: viewportWidth,
    height: viewportHeight,
    availableWidth: finalWidth,
    availableHeight: finalHeight
  };
}

/**
 * Check if current viewport is considered a small screen
 * Useful for applying different performance settings
 */
export function isSmallScreen(): boolean {
  const dimensions = calculateOptimalDimensions();
  // Consider it small if we're at or below the minimum viable dimensions
  return dimensions.availableWidth === 800 || dimensions.availableHeight === 600;
}

/**
 * Get device category based on viewport dimensions
 * Useful for applying device-specific optimizations
 */
export function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}