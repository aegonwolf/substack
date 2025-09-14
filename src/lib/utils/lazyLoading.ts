/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Create a component loader function with retry logic
 * @param importFn Dynamic import function
 * @param maxRetries Maximum retry attempts
 * @returns Function that loads component with retry logic
 */
export function createComponentLoader(
  importFn: () => Promise<any>,
  maxRetries: number = 3
) {
  return () => retryWithBackoff(importFn, maxRetries);
}

/**
 * Default intersection observer options for lazy loading
 */
export const DEFAULT_OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: '200px', // Start loading 200px before entering viewport
  threshold: 0.1
};

/**
 * Component loading priorities
 */
export const LOADING_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium', 
  LOW: 'low'
} as const;

export type LoadingPriority = typeof LOADING_PRIORITIES[keyof typeof LOADING_PRIORITIES];