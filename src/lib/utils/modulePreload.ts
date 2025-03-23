/**
 * Module preloading utility for MTGSvelte3
 * Handles preloading of modules based on navigation and user interactions
 */

// Track which modules have been preloaded
const preloadedModules = new Set<string>();

// Critical path modules that should be preloaded early
const criticalModules = [
  '/src/lib/components/DeckBuilder.svelte',
  '/src/lib/components/CardScanner.svelte',
  '/src/lib/components/DeckTabs.svelte'
];

// Secondary modules that can be preloaded after critical modules
const secondaryModules = [
  '/src/lib/components/DeckStats.svelte',
  '/src/lib/components/DeckExport.svelte'
];

/**
 * Preload a specific module
 * @param modulePath Path to the module to preload
 * @returns Promise that resolves when the module is loaded
 */
export function preloadModule(modulePath: string): Promise<any> {
  if (preloadedModules.has(modulePath)) {
    return Promise.resolve();
  }
  
  // Mark this module as being preloaded
  preloadedModules.add(modulePath);
  
  // Convert path format to dynamic import format
  const importPath = modulePath.replace('/src/', '../');
  
  // Use dynamic import to preload
  return import(/* @vite-ignore */ importPath)
    .then(module => {
      console.debug(`Preloaded module: ${modulePath}`);
      return module;
    })
    .catch(error => {
      console.error(`Failed to preload module: ${modulePath}`, error);
      preloadedModules.delete(modulePath);
    });
}

/**
 * Preload critical path modules
 */
export function preloadCriticalModules(): void {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  // Spread out the loading to avoid network congestion
  setTimeout(() => {
    criticalModules.forEach((modulePath, index) => {
      setTimeout(() => {
        preloadModule(modulePath);
      }, index * 100); // Stagger each load by 100ms
    });
  }, 300); // Start after 300ms to allow critical rendering to complete
}

/**
 * Preload secondary modules
 */
export function preloadSecondaryModules(): void {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  // Only preload secondary modules after critical modules and initial page load
  setTimeout(() => {
    secondaryModules.forEach((modulePath, index) => {
      setTimeout(() => {
        preloadModule(modulePath);
      }, index * 200); // Stagger each load by 200ms
    });
  }, 2000); // Wait 2 seconds for initial page load and critical modules
}

/**
 * Preload modules for a specific route
 * @param route Current application route
 */
export function preloadRouteModules(route: string): void {
  if (typeof window === 'undefined') return; // Skip during SSR
  
  if (route.includes('/auth/decks')) {
    preloadModule('/src/lib/components/DeckBuilder.svelte');
    preloadModule('/src/lib/components/DeckList.svelte');
  } else if (route.includes('/scanner')) {
    preloadModule('/src/lib/components/CardScanner.svelte');
  }
}

// Initialize preloading when this module is imported
preloadCriticalModules();
// Preload secondary modules with a delay
preloadSecondaryModules();