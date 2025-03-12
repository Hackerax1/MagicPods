<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  // Props
  export let show = false;
  export let title = '';
  export let closeOnEscape = true;
  export let closeOnOutsideClick = true;
  export let width = 'max-w-md';

  const dispatch = createEventDispatcher();

  let modalElement: HTMLDivElement;

  function close() {
    dispatch('close');
  }

  function handleEscape(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape' && show) {
      event.preventDefault();
      close();
    }
  }

  function handleOutsideClick(event: MouseEvent) {
    if (closeOnOutsideClick && modalElement && !modalElement.contains(event.target as Node) && show) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleEscape);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleEscape);
  });

  $: if (show) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
</script>

{#if show}
  <div 
    class="modal-overlay"
    transition:fade={{ duration: 150 }}
    on:click={handleOutsideClick}
    role="presentation"
  >
    <div 
      bind:this={modalElement}
      class="modal {width}"
      transition:scale={{ duration: 150, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {#if title || ($$slots?.header)}
        <div class="modal-header">
          {#if $$slots.header}
            <slot name="header"></slot>
          {:else}
            <h3 class="modal-title" id="modal-title">{title}</h3>
          {/if}
          <button
            type="button"
            class="modal-close"
            on:click={close}
            on:keydown={(e) => e.key === 'Enter' && close()}
            aria-label="Close"
          >
            <span class="sr-only">Close</span>
            <svg class="modal-close-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="modal-body">
        <slot></slot>
      </div>
      
      {#if $$slots?.footer}
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: var(--z-modal);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-4);
  }

  .modal {
    background-color: var(--bg-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    width: 100%;
    max-height: calc(100vh - var(--space-16));
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: var(--space-4) var(--space-4);
    border-bottom: 1px solid var(--border-default);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin: 0;
  }

  .modal-close {
    background-color: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-md);
    transition: color var(--transition-fast), background-color var(--transition-fast);
  }

  .modal-close:hover {
    color: var(--text-primary);
    background-color: var(--bg-subtle);
  }

  .modal-close:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--border-focus);
  }

  .modal-close-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .modal-body {
    padding: var(--space-5) var(--space-6);
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: var(--space-3) var(--space-6);
    background-color: var(--bg-subtle);
    border-top: 1px solid var(--border-default);
  }

  /* Modal sizes */
  .max-w-xs {
    max-width: 20rem;
  }
  
  .max-w-sm {
    max-width: 24rem;
  }
  
  .max-w-md {
    max-width: 28rem;
  }
  
  .max-w-lg {
    max-width: 32rem;
  }
  
  .max-w-xl {
    max-width: 36rem;
  }
  
  .max-w-2xl {
    max-width: 42rem;
  }
  
  .max-w-3xl {
    max-width: 48rem;
  }
  
  .max-w-4xl {
    max-width: 56rem;
  }
  
  .max-w-5xl {
    max-width: 64rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  @media (min-width: 640px) {
    .modal-header {
      padding: var(--space-3) var(--space-6);
    }
  }
</style>