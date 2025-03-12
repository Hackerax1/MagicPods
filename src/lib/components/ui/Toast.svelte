<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  
  // Props
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let message: string = '';
  export let duration: number = 5000; // Duration in milliseconds
  export let showIcon: boolean = true;
  export let showClose: boolean = true;
  export let id: string = '';
  
  const dispatch = createEventDispatcher();
  
  let timeoutId: ReturnType<typeof setTimeout>;
  
  // Automatically close the toast after duration
  onMount(() => {
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        close();
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
  
  function close() {
    dispatch('close', { id });
  }
  
  function handleMouseEnter() {
    if (timeoutId) clearTimeout(timeoutId);
  }
  
  function handleMouseLeave() {
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        close();
      }, duration);
    }
  }
</script>

<div 
  class="toast toast-{type}"
  role="alert"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  transition:fly={{ duration: 300, y: 24 }}
>
  <div class="toast-content">
    {#if showIcon}
      <div class="toast-icon">
        {#if type === 'info'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if type === 'success'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if type === 'warning'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        {:else if type === 'error'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
      </div>
    {/if}
    
    <div class="toast-message">
      {message}
      <slot></slot>
    </div>
    
    {#if showClose}
      <button
        type="button"
        class="toast-close"
        on:click={close}
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
  
  <div class="toast-progress" style="animation-duration: {duration}ms;">
  </div>
</div>

<style>
  .toast {
    position: relative;
    min-width: 300px;
    max-width: 400px;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    margin-bottom: var(--space-3);
    overflow: hidden;
    font-family: var(--font-primary);
    pointer-events: auto;
  }
  
  .toast-info {
    background-color: var(--info-light);
    border-left: 4px solid var(--info);
    color: var(--info-dark);
  }
  
  .toast-success {
    background-color: var(--success-light);
    border-left: 4px solid var(--success);
    color: var(--success-dark);
  }
  
  .toast-warning {
    background-color: var(--warning-light);
    border-left: 4px solid var(--warning);
    color: var(--warning-dark);
  }
  
  .toast-error {
    background-color: var(--error-light);
    border-left: 4px solid var(--error);
    color: var(--error-dark);
  }
  
  .toast-content {
    display: flex;
    align-items: center;
  }
  
  .toast-icon {
    flex-shrink: 0;
    margin-right: var(--space-3);
  }
  
  .toast-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .toast-message {
    flex: 1;
    font-size: var(--text-sm);
  }
  
  .toast-close {
    background-color: transparent;
    border: none;
    color: currentColor;
    padding: 0;
    cursor: pointer;
    margin-left: var(--space-3);
    opacity: 0.7;
    transition: opacity var(--transition-fast);
  }
  
  .toast-close:hover {
    opacity: 1;
  }
  
  .toast-close svg {
    width: 1rem;
    height: 1rem;
  }
  
  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.4);
    animation: progress-bar linear forwards;
    transform-origin: left;
  }
  
  @keyframes progress-bar {
    0% {
      width: 100%;
    }
    100% {
      width: 0%;
    }
  }
</style>