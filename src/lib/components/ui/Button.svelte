<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth: boolean = false;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button 
  {type}
  class="btn btn-{variant} btn-{size} {fullWidth ? 'btn-full' : ''} {loading ? 'btn-loading' : ''}"
  on:click={handleClick}
  disabled={disabled || loading}
  aria-disabled={disabled || loading}
  aria-label={ariaLabel}
  {...$$restProps}
>
  {#if loading}
    <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-primary);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    transition: background-color var(--transition-fast), color var(--transition-fast), 
                border-color var(--transition-fast), box-shadow var(--transition-fast);
    cursor: pointer;
    border: none;
    outline: none;
  }

  .btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg-default), 0 0 0 4px var(--border-focus);
  }

  /* Size variants */
  .btn-sm {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    height: 2rem;
  }

  .btn-md {
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    height: 2.5rem;
  }

  .btn-lg {
    font-size: var(--text-md);
    padding: var(--space-2-5) var(--space-5);
    height: 3rem;
  }

  /* Width */
  .btn-full {
    width: 100%;
  }

  /* Loading state */
  .btn-loading {
    position: relative;
    color: transparent !important;
  }

  .loading-spinner {
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Button variants */
  .btn-primary {
    background-color: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-dark);
  }

  .btn-primary:active:not(:disabled) {
    background-color: var(--primary-darker);
  }

  .btn-secondary {
    background-color: var(--secondary);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--secondary-dark);
  }

  .btn-secondary:active:not(:disabled) {
    background-color: var(--secondary-darker);
  }

  .btn-success {
    background-color: var(--success);
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background-color: var(--success-dark);
  }

  .btn-success:active:not(:disabled) {
    background-color: var(--success-darker);
  }

  .btn-warning {
    background-color: var(--warning);
    color: var(--warning-darker);
  }

  .btn-warning:hover:not(:disabled) {
    background-color: var(--warning-dark);
    color: white;
  }

  .btn-warning:active:not(:disabled) {
    background-color: var(--warning-darker);
    color: white;
  }

  .btn-error {
    background-color: var(--error);
    color: white;
  }

  .btn-error:hover:not(:disabled) {
    background-color: var(--error-dark);
  }

  .btn-error:active:not(:disabled) {
    background-color: var(--error-darker);
  }

  .btn-outline {
    background-color: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-primary);
  }

  .btn-outline:hover:not(:disabled) {
    background-color: var(--bg-subtle);
    border-color: var(--border-hover);
  }

  .btn-outline:active:not(:disabled) {
    background-color: var(--bg-muted);
    border-color: var(--border-pressed);
  }

  .btn-ghost {
    background-color: transparent;
    color: var(--text-primary);
  }

  .btn-ghost:hover:not(:disabled) {
    background-color: var(--bg-subtle);
  }

  .btn-ghost:active:not(:disabled) {
    background-color: var(--bg-muted);
  }

  /* Disabled state */
  .btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
</style>