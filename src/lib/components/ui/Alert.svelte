<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let title: string = '';
  export let dismissable: boolean = false;
  export let icon: boolean = true;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  // Define alert variant properties
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-500',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
      icon: `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      `
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-500',
      iconColor: 'text-green-500',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
      icon: `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      `
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-l-4 border-amber-500',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-700',
      icon: `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      `
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
      icon: `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      `
    }
  };

  const variant = variants[type];
</script>

<div 
  class={`p-4 rounded-md ${variant.bg} ${variant.border} relative`} 
  role="alert"
  aria-live={type === 'error' ? 'assertive' : 'polite'}
  {...$$restProps}
>
  <div class="flex">
    {#if icon}
      <div class="flex-shrink-0">
        <svg class={`h-5 w-5 ${variant.iconColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {@html variant.icon}
        </svg>
      </div>
    {/if}
    
    <div class={`${icon ? 'ml-3' : ''} flex-1`}>
      {#if title}
        <h3 class={`text-sm font-medium ${variant.titleColor}`}>{title}</h3>
      {/if}
      
      <div class={`text-sm ${variant.textColor} ${title ? 'mt-2' : ''}`}>
        <slot />
      </div>
    </div>
    
    {#if dismissable}
      <div class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class={`inline-flex rounded-md p-1.5 ${variant.bg} ${variant.textColor} hover:${variant.bg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'amber' : 'red'}-50 focus:ring-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'amber' : 'red'}-500`}
            aria-label="Dismiss"
            on:click={close}
          >
            <span class="sr-only">Dismiss</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>