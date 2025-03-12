<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let id: string;
  export let name: string = id;
  export let label: string = '';
  export let checked: boolean = false;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: string = '';
  export let helpText: string = '';
  
  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    dispatch('change', { checked });
  }
</script>

<div class="checkbox-wrapper">
  <div class="checkbox-container">
    <input 
      type="checkbox"
      {id}
      {name}
      bind:checked
      {disabled}
      {required}
      on:change={handleChange}
      class="checkbox {error ? 'checkbox-error' : ''} {disabled ? 'checkbox-disabled' : ''}"
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : helpText ? `${id}-description` : undefined}
      {...$$restProps}
    />
    
    <label for={id} class="checkbox-label">
      {label}
      {#if required}<span class="checkbox-required">*</span>{/if}
    </label>
  </div>
  
  {#if error}
    <p id="{id}-error" class="checkbox-error-message" role="alert">{error}</p>
  {:else if helpText}
    <p id="{id}-description" class="checkbox-help-text">{helpText}</p>
  {/if}
</div>

<style>
  .checkbox-wrapper {
    width: 100%;
    font-family: var(--font-primary);
  }

  .checkbox-container {
    display: flex;
    align-items: center;
  }

  .checkbox {
    position: relative;
    width: 1rem;
    height: 1rem;
    appearance: none;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    background-color: var(--bg-default);
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
    cursor: pointer;
  }

  .checkbox:checked {
    background-color: var(--primary);
    border-color: var(--primary);
  }

  .checkbox:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -60%) rotate(45deg);
    width: 0.25rem;
    height: 0.5rem;
    border-bottom: 2px solid white;
    border-right: 2px solid white;
  }

  .checkbox:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-lightest);
    border-color: var(--primary);
  }

  .checkbox:disabled {
    background-color: var(--bg-subtle);
    border-color: var(--border-default);
    cursor: not-allowed;
  }

  .checkbox-error {
    border-color: var(--error);
  }

  .checkbox-error:focus {
    box-shadow: 0 0 0 2px var(--error-light);
  }

  .checkbox-label {
    margin-left: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-primary);
    cursor: pointer;
  }

  .checkbox-disabled + .checkbox-label {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .checkbox-required {
    color: var(--error);
    margin-left: var(--space-0-5);
  }

  .checkbox-error-message {
    font-size: var(--text-sm);
    color: var(--error);
    margin-top: var(--space-1);
  }

  .checkbox-help-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-top: var(--space-1);
  }
</style>