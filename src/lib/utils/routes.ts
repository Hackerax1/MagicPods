import { base } from '$app/paths';

/**
 * Helper function to prepend the base path to routes for GitHub Pages compatibility
 * @param path The route path
 * @returns The path with the base prepended
 */
export function getRoute(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Handle empty paths (for root route)
  if (!cleanPath) {
    return base || '/';
  }
  
  // For GitHub Pages, make sure we have the correct format
  return `${base}/${cleanPath}`;
}

/**
 * Helper function to get absolute URL for assets
 * @param path The asset path
 * @returns The absolute URL for the asset
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${base}/${cleanPath}`;
}