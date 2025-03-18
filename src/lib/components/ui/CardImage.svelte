<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // Props
  export let cardId: string = '';              // Unique identifier for the card
  export let imageUrl: string = '';            // Primary image URL
  export let altText: string = 'Card image';   // Alt text for accessibility
  export let placeholderUrl: string = '';      // Optional placeholder image
  export let artOnly: boolean = false;         // Whether to display just the art crop
  export let sizes: string = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'; // Default sizes attribute
  export let loading: 'eager' | 'lazy' = 'lazy'; // Lazy loading by default
  
  // Internal state
  let loaded = false;
  let error = false;
  let imgElement: HTMLImageElement;
  let observer: IntersectionObserver;
  let inViewport = false;
  
  // Generate srcset based on image URL
  $: srcset = generateSrcset(imageUrl);
  
  // Determine which image to show
  $: displayUrl = loaded ? imageUrl : (placeholderUrl || getPlaceholderForCard(cardId));
  
  // Real Scryfall image sizes for optimal loading
  function generateSrcset(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // Scryfall provides different sizes
    const formats = [
      { suffix: 'small', width: 146 },  // Small size
      { suffix: 'normal', width: 488 }, // Normal size
      { suffix: 'large', width: 672 },  // Large size
      { suffix: 'png', width: 745 }     // PNG size
    ];
    
    // For art crops we have different sizes
    if (artOnly) {
      return [
        imageUrl.replace('/normal/', '/art_crop/') + ' 626w',
        imageUrl + ' 488w'
      ].join(', ');
    }
    
    // Replace the size part in URL to generate srcset
    return formats
      .map(format => {
        const url = imageUrl.replace('/normal/', `/${format.suffix}/`);
        return `${url} ${format.width}w`;
      })
      .join(', ');
  }
  
  // Generate placeholder image data URL based on card ID
  function getPlaceholderForCard(id: string): string {
    // If no ID, return generic placeholder
    if (!id) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 680" fill="%23eee"%3E%3Crect width="488" height="680" rx="16" /%3E%3C/svg%3E';
    }
    
    // Generate a color from the card ID for a unique placeholder
    const color = stringToColor(id);
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 680" fill="%23${color}"%3E%3Crect width="488" height="680" rx="16" /%3E%3C/svg%3E`;
  }
  
  // Convert string to color hex
  function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a pastel color
    const h = hash % 360;
    return hslToHex(h, 70, 80);
  }
  
  // Convert HSL to hex color
  function hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  // Set up intersection observer for advanced lazy loading
  onMount(() => {
    // Skip observer if loading is eager
    if (loading === 'eager') {
      inViewport = true;
      return;
    }
    
    // Use Intersection Observer for better lazy loading control
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          inViewport = true;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading when within 200px of viewport
    );
    
    observer.observe(imgElement);
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  });
  
  // Handle image load event
  function handleLoad() {
    loaded = true;
  }
  
  // Handle image error
  function handleError() {
    error = true;
    // Fall back to placeholder
    loaded = false;
  }
</script>

<div class="card-image-container" class:art-only={artOnly}>
  <!-- Hidden image that triggers the proper load -->
  {#if inViewport && imageUrl}
    <img
      src={imageUrl}
      srcset={srcset}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      style="position: absolute; opacity: 0; z-index: -1;"
      on:load={handleLoad}
      on:error={handleError}
    />
  {/if}
  
  <!-- Visible image with transition effects -->
  <div class="card-image-wrapper">
    <img
      bind:this={imgElement}
      src={displayUrl}
      class:loaded={loaded}
      class:placeholder={!loaded}
      class:error={error}
      alt={altText}
      loading={loading}
    />
    
    {#if !loaded}
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    {/if}
    
    {#if error}
      <div class="error-overlay" transition:fade={{ duration: 200 }}>
        <span>Failed to load image</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .card-image-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 140%; /* MTG card ratio */
    overflow: hidden;
    background-color: #f0f0f0;
    border-radius: 4.5%;
  }
  
  .art-only {
    padding-bottom: 70%; /* Art crop ratio */
  }
  
  .card-image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    transition: filter 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }
  
  .placeholder {
    filter: blur(8px);
  }
  
  .loaded {
    filter: blur(0);
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.4);
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 0, 0, 0.1);
  }
  
  .error-overlay span {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>