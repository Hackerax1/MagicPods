import { base } from '$app/paths';

/**
 * Helper function to prepend the base path to routes for GitHub Pages compatibility
 * @param path The route path
 * @returns The path with the base prepended
 */
export function getRoute(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${base}/${cleanPath}`;
}