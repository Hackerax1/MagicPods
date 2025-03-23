<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  // Props
  export let threshold = 0.1; // How much of element must be visible
  export let rootMargin = '200px'; // Start loading before element is visible
  export let enabled = true; // Whether lazy loading is enabled
  export let placeholder: any = null; // Optional placeholder while loading
  export let height: string = 'auto'; // Optional height before loading
  
  // State
  let element: HTMLElement;
  let isIntersecting = false;
  let observer: IntersectionObserver | null = null;
  
  const dispatch = createEventDispatcher();
  
  // Set up the intersection observer when the component mounts
  onMount(() => {
    if (!enabled) {
      isIntersecting = true;
      dispatch('visible');
      return;
    }
    
    observer = new IntersectionObserver(
      entries => {
        // When the element becomes visible
        if (entries[0].isIntersecting) {
          isIntersecting = true;
          dispatch('visible');
          
          // Cleanup observer once it's triggered
          if (observer) {
            observer.disconnect();
            observer = null;
          }
        }
      },
      { rootMargin, threshold }
    );
    
    if (element) {
      observer.observe(element);
    }
  });
  
  // Clean up the observer when the component is destroyed
  onDestroy(() => {
    if (observer) {
      observer.disconnect();
    }
  });
</script>

<div bind:this={element} style="min-height: {height};">
  {#if isIntersecting}
    <slot />
  {:else if placeholder}
    {#if typeof placeholder === 'function'}
      <svelte:component this={placeholder} />
    {:else}
      {placeholder}
    {/if}
  {:else}
    <!-- Default placeholder -->
    <div class="lazy-load-placeholder">
      <slot name="placeholder" />
    </div>
  {/if}
</div>

<style>
  .lazy-load-placeholder {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>