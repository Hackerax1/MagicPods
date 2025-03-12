<script lang="ts">
  // Props
  export let title: string = '';
  export let subtitle: string = '';
  export let elevation: 'flat' | 'raised' | 'elevated' = 'raised';
  export let padding: 'none' | 'small' | 'default' | 'large' = 'default';
  export let borderColor: string | undefined = undefined;
</script>

<div
  class="card card-{elevation} {borderColor ? `card-border-${borderColor}` : ''} card-padding-{padding}"
  role="article"
  {...$$restProps}
>
  {#if title}
    <div class={padding === 'none' ? 'card-header-with-padding' : 'card-header'}>
      <h3 class="card-title {subtitle ? 'with-subtitle' : ''}">{title}</h3>
      {#if subtitle}
        <p class="card-subtitle">{subtitle}</p>
      {/if}
    </div>
  {/if}
  
  <div class={title && padding === 'none' ? 'card-body-with-padding' : 'card-body'}>
    <slot />
  </div>
  
  {#if $$slots.footer}
    <div class="card-footer {padding === 'none' ? 'footer-with-padding' : ''}">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background-color: var(--bg-default);
    overflow: hidden;
    border-radius: var(--radius-lg);
    font-family: var(--font-primary);
    color: var(--text-primary);
  }

  .card-flat {
    border: 1px solid var(--border-default);
  }

  .card-raised {
    box-shadow: var(--shadow-md);
  }

  .card-elevated {
    box-shadow: var(--shadow-lg);
  }

  .card-border-primary {
    border-left: 4px solid var(--primary);
  }

  .card-border-secondary {
    border-left: 4px solid var(--secondary);
  }

  .card-border-success {
    border-left: 4px solid var(--success);
  }

  .card-border-warning {
    border-left: 4px solid var(--warning);
  }

  .card-border-error {
    border-left: 4px solid var(--error);
  }

  .card-padding-none {
    padding: 0;
  }

  .card-padding-small {
    padding: var(--space-3);
  }

  .card-padding-default {
    padding: var(--space-4);
  }

  .card-padding-large {
    padding: var(--space-6);
  }

  .card-header {
    margin-bottom: var(--space-4);
  }

  .card-header-with-padding {
    padding: var(--space-4);
    padding-bottom: 0;
  }

  .card-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);
    margin: 0;
    margin-bottom: var(--space-4);
  }

  .card-title.with-subtitle {
    margin-bottom: var(--space-1);
  }

  .card-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
    margin-bottom: var(--space-4);
  }

  .card-body-with-padding {
    padding: var(--space-4);
    padding-top: 0;
  }

  .card-footer {
    margin-top: var(--space-4);
    margin-left: calc(var(--space-4) * -1);
    margin-right: calc(var(--space-4) * -1);
    margin-bottom: calc(var(--space-4) * -1);
    background-color: var(--bg-subtle);
    border-top: 1px solid var(--border-default);
    padding: var(--space-3) var(--space-4);
  }

  .footer-with-padding {
    margin: 0;
    padding: var(--space-3) var(--space-4);
  }

  @media (min-width: 640px) {
    .card-padding-default {
      padding: var(--space-6);
    }

    .card-padding-large {
      padding: var(--space-8);
    }

    .card-footer {
      margin-left: calc(var(--space-6) * -1);
      margin-right: calc(var(--space-6) * -1);
      margin-bottom: calc(var(--space-6) * -1);
      padding: var(--space-3) var(--space-6);
    }
  }
</style>