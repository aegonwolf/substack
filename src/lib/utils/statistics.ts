import { scaleLinear } from 'd3-scale';

// Statistical calculation functions
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateMin(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

export function calculateMax(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;
  
  const mean = calculateAverage(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateAverage(squaredDiffs));
}

// D3 scaling utility functions for bar width calculations
export function createBarScale(data: number[], maxWidth: number = 100) {
  if (data.length === 0) {
    return scaleLinear().domain([0, 1]).range([0, maxWidth]);
  }
  
  const maxValue = Math.max(...data);
  if (maxValue === 0) return scaleLinear().domain([0, 1]).range([0, maxWidth]);
  
  return scaleLinear()
    .domain([0, maxValue])
    .range([0, maxWidth]);
}

export function calculateBarWidth(value: number, scale: ReturnType<typeof createBarScale>): number {
  return scale(value);
}

// Color utility functions using Skeleton's color palette
export function getSkeletonColor(index: number): string {
  const colors = [
    'preset-filled-primary-500',
    'preset-filled-secondary-500', 
    'preset-filled-tertiary-500',
    'preset-filled-success-500',
    'preset-filled-warning-500',
    'preset-filled-error-500',
    'preset-filled-surface-500'
  ];
  // Handle negative indices properly
  const normalizedIndex = ((index % colors.length) + colors.length) % colors.length;
  return colors[normalizedIndex];
}

export function getSkeletonColorVariant(index: number, variant: '300' | '500' | '700' = '500'): string {
  const colorBases = [
    'primary',
    'secondary', 
    'tertiary',
    'success',
    'warning',
    'error',
    'surface'
  ];
  const colorBase = colorBases[index % colorBases.length];
  return `bg-${colorBase}-${variant}`;
}

// Number formatting utility
export function formatSubscriberCount(count: number): string {
  return new Intl.NumberFormat('en-US').format(count);
}