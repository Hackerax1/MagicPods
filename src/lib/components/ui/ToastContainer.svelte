<script lang="ts">
  import { writable } from 'svelte/store';
  import Toast from './Toast.svelte';
  
  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' = 'top-right';
  export let limit: number = 5;

  // Create a toast store
  export const toasts = writable<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
  }[]>([]);

  // Helper functions to add toasts
  export function addToast(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 5000
  ) {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.update(all => {
      // If we're at the limit, remove the oldest toast
      if (limit > 0 && all.length >= limit) {
        return [...all.slice(1), { id, message, type, duration }];
      }
      return [...all, { id, message, type, duration }];
    });

    return id;
  }

  export function removeToast(id: string) {
    toasts.update(all => all.filter(t => t.id !== id));
  }

  // Shorthand methods
  export function success(message: string, duration?: number) {
    return addToast(message, 'success', duration);
  }

  export function error(message: string, duration?: number) {
    return addToast(message, 'error', duration);
  }

  export function warning(message: string, duration?: number) {
    return addToast(message, 'warning', duration);
  }

  export function info(message: string, duration?: number) {
    return addToast(message, 'info', duration);
  }

  function getPositionClass(pos: string) {
    switch(pos) {
      case 'top-right': return 'top-right';
      case 'top-left': return 'top-left';
      case 'bottom-right': return 'bottom-right';
      case 'bottom-left': return 'bottom-left';
      case 'top-center': return 'top-center';
      case 'bottom-center': return 'bottom-center';
      default: return 'top-right';
    }
  }

  function handleClose(event: CustomEvent) {
    const { id } = event.detail;
    removeToast(id);
  }
</script>

<div class="toast-container {getPositionClass(position)}">
  {#each $toasts as toast (toast.id)}
    <Toast 
      id={toast.id}
      type={toast.type}
      message={toast.message}
      duration={toast.duration}
      on:close={handleClose}
    />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    z-index: var(--z-tooltip);
    display: flex;
    flex-direction: column;
    pointer-events: none;
    padding: var(--space-4);
    max-width: 100%;
    width: max-content;
  }

  .top-right {
    top: 0;
    right: 0;
  }

  .top-left {
    top: 0;
    left: 0;
  }

  .bottom-right {
    bottom: 0;
    right: 0;
  }

  .bottom-left {
    bottom: 0;
    left: 0;
  }

  .top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
  }
</style>