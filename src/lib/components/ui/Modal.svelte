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
    class="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center p-4"
    transition:fade={{ duration: 150 }}
    on:click={handleOutsideClick}
    role="presentation"
  >
    <div 
      bind:this={modalElement}
      class={`bg-white rounded-lg shadow-xl transform overflow-hidden ${width} w-full`}
      transition:scale={{ duration: 150, start: 0.95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {#if title || ($$slots?.header)}
        <div class="px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          {#if $$slots.header}
            <slot name="header"></slot>
          {:else}
            <h3 class="text-lg font-medium text-gray-900" id="modal-title">{title}</h3>
          {/if}
          <button
            type="button"
            class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            on:click={close}
            on:keydown={(e) => e.key === 'Enter' && close()}
            aria-label="Close"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="px-4 py-5 sm:p-6">
        <slot></slot>
      </div>
      
      {#if $$slots?.footer}
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <slot name="footer"></slot>
        </div>
      {/if}
    </div>
  </div>
{/if}