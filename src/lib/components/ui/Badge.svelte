<script lang="ts">
  // Props
  export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let rounded: boolean = true;
  export let outline: boolean = false;
</script>

<span 
  class="badge badge-{variant} badge-{size} {rounded ? 'badge-rounded' : ''} {outline ? 'badge-outline' : ''}"
  {...$$restProps}
>
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-primary);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
  }

  .badge-sm {
    font-size: var(--text-xs);
    padding: var(--space-0-5) var(--space-2);
  }

  .badge-md {
    font-size: var(--text-xs);
    padding: var(--space-0-5) var(--space-2-5);
  }

  .badge-lg {
    font-size: var(--text-sm);
    padding: var(--space-1) var(--space-3);
  }

  .badge-rounded {
    border-radius: var(--radius-full);
  }

  .badge:not(.badge-rounded) {
    border-radius: var(--radius-md);
  }

  /* Default */
  .badge-default {
    background-color: var(--bg-subtle);
    color: var(--text-secondary);
  }

  .badge-default.badge-outline {
    background-color: transparent;
    border: 1px solid var(--color-gray-600);
    color: var(--color-gray-600);
  }

  /* Primary */
  .badge-primary {
    background-color: var(--color-primary-100);
    color: var(--color-primary-800);
  }

  .badge-primary.badge-outline {
    background-color: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
  }

  /* Secondary */
  .badge-secondary {
    background-color: var(--color-secondary-100);
    color: var(--color-secondary-800);
  }

  .badge-secondary.badge-outline {
    background-color: transparent;
    border: 1px solid var(--secondary);
    color: var(--secondary);
  }

  /* Success */
  .badge-success {
    background-color: var(--success-light);
    color: var(--success-dark);
  }

  .badge-success.badge-outline {
    background-color: transparent;
    border: 1px solid var(--success);
    color: var(--success);
  }

  /* Warning */
  .badge-warning {
    background-color: var(--warning-light);
    color: var(--warning-dark);
  }

  .badge-warning.badge-outline {
    background-color: transparent;
    border: 1px solid var(--warning);
    color: var(--warning);
  }

  /* Error */
  .badge-error {
    background-color: var(--error-light);
    color: var(--error-dark);
  }

  .badge-error.badge-outline {
    background-color: transparent;
    border: 1px solid var(--error);
    color: var(--error);
  }

  /* Info */
  .badge-info {
    background-color: var(--info-light);
    color: var(--info-dark);
  }

  .badge-info.badge-outline {
    background-color: transparent;
    border: 1px solid var(--info);
    color: var(--info);
  }
</style>