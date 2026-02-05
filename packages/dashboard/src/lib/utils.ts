import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a file path for display (truncate long paths)
 */
export function formatPath(path: string, maxLength = 50): string {
  if (path.length <= maxLength) return path;
  
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  
  // Keep first and last parts, ellipsis in middle
  const first = parts[0];
  const last = parts.slice(-2).join('/');
  return `${first}/.../${last}`;
}

/**
 * Format a date for display
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Get risk level color class
 */
export function getRiskColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case 'HIGH':
      return 'text-red-500';
    case 'MEDIUM':
      return 'text-yellow-500';
    case 'LOW':
      return 'text-green-500';
    default:
      return 'text-zinc-500';
  }
}

/**
 * Get risk level background color class
 */
export function getRiskBgColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-500/20 border-red-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'LOW':
      return 'bg-green-500/20 border-green-500/30';
    default:
      return 'bg-zinc-500/20 border-zinc-500/30';
  }
}

/**
 * Get permission color class
 */
export function getPermissionColor(permission: string): string {
  switch (permission.toUpperCase()) {
    case 'READ':
      return 'text-blue-400';
    case 'WRITE':
      return 'text-amber-400';
    case 'DELETE':
      return 'text-red-400';
    case 'EXECUTE':
      return 'text-purple-400';
    case 'OUTPUT':
      return 'text-cyan-400';
    default:
      return 'text-zinc-400';
  }
}

/**
 * Get permission background color class
 */
export function getPermissionBgColor(permission: string): string {
  switch (permission.toUpperCase()) {
    case 'READ':
      return 'bg-blue-500/20';
    case 'WRITE':
      return 'bg-amber-500/20';
    case 'DELETE':
      return 'bg-red-500/20';
    case 'EXECUTE':
      return 'bg-purple-500/20';
    case 'OUTPUT':
      return 'bg-cyan-500/20';
    default:
      return 'bg-zinc-500/20';
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Group array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
