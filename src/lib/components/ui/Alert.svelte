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
</script>

<div 
  class="alert alert-{type} {dismissable ? 'alert-dismissable' : ''}"
  role="alert"
  aria-live={type === 'error' ? 'assertive' : 'polite'}
  {...$$restProps}
>
  <div class="alert-content">
    {#if icon}
      <div class="alert-icon">
        {#if type === 'info'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if type === 'success'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if type === 'warning'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        {:else if type === 'error'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
      </div>
    {/if}
    
    <div class="alert-body">
      {#if title}
        <h3 class="alert-title">{title}</h3>
      {/if}
      
      <div class="alert-text {title ? 'with-title' : ''}">
        <slot />
      </div>
    </div>
    
    {#if dismissable}
      <div class="alert-dismiss">
        <button
          type="button"
          class="dismiss-button"
          aria-label="Dismiss"
          on:click={close}
        >
          <span class="sr-only">Dismiss</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .alert {
    padding: var(--space-4);
    border-radius: var(--radius-md);
    position: relative;
  }

  .alert-info {
    background-color: var(--info-light);
    border-left: 4px solid var(--info);
  }

  .alert-success {
    background-color: var(--success-light);
    border-left: 4px solid var(--success);
  }

  .alert-warning {
    background-color: var(--warning-light);
    border-left: 4px solid var(--warning);
  }

  .alert-error {
    background-color: var(--error-light);
    border-left: 4px solid var(--error);
  }

  .alert-content {
    display: flex;
    align-items: flex-start;
  }

  .alert-icon {
    flex-shrink: 0;
    margin-right: var(--space-3);
  }

  .alert-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .alert-info .alert-icon svg {
    color: var(--info);
  }

  .alert-success .alert-icon svg {
    color: var(--success);
  }

  .alert-warning .alert-icon svg {
    color: var(--warning);
  }

  .alert-error .alert-icon svg {
    color: var(--error);
  }

  .alert-body {
    flex: 1;
  }

  .alert-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    margin: 0;
    margin-bottom: var(--space-1);
  }

  .alert-info .alert-title {
    color: var(--info-dark);
  }

  .alert-success .alert-title {
    color: var(--success-dark);
  }

  .alert-warning .alert-title {
    color: var(--warning-dark);
  }

  .alert-error .alert-title {
    color: var(--error-dark);
  }

  .alert-text {
    font-size: var(--text-sm);
  }

  .alert-text.with-title {
    margin-top: var(--space-2);
  }

  .alert-info .alert-text {
    color: var(--info-dark);
  }

  .alert-success .alert-text {
    color: var(--success-dark);
  }

  .alert-warning .alert-text {
    color: var(--warning-dark);
  }

  .alert-error .alert-text {
    color: var(--error-dark);
  }

  .alert-dismiss {
    margin-left: var(--space-3);
  }

  .dismiss-button {
    display: inline-flex;
    padding: var(--space-1-5);
    margin-top: calc(var(--space-1-5) * -1);
    margin-right: calc(var(--space-1-5) * -1);
    border-radius: var(--radius-md);
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast);
    color: inherit;
  }

  .dismiss-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .dismiss-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--bg-default), 0 0 0 4px var(--border-focus);
  }

  .dismiss-button svg {
    width: 1.25rem;
    height: 1.25rem;
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
</style>