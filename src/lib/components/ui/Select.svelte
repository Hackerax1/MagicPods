<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let id: string;
  export let name: string = id;
  export let label: string = '';
  export let value: string | number | undefined = undefined;
  export let options: Array<{ value: string | number; label: string }> = [];
  export let placeholder: string = 'Select an option';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: string = '';
  export let helpText: string = '';
  
  const dispatch = createEventDispatcher();
  
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = target.value;
    dispatch('change', { value });
  }
</script>

<div class="select-wrapper">
  {#if label}
    <label for={id} class="select-label">
      {label}
      {#if required}<span class="select-required">*</span>{/if}
    </label>
  {/if}
  
  <div class="select-container">
    <select
      {id}
      {name}
      bind:value
      {disabled}
      {required}
      class="select {error ? 'select-error' : ''} {disabled ? 'select-disabled' : ''}"
      on:change={handleChange}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : helpText ? `${id}-description` : undefined}
      {...$$restProps}
    >
      <option value="" disabled selected={!value}>{placeholder}</option>
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    
    <div class="select-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
  
  {#if error}
    <p id="{id}-error" class="select-error-message" role="alert">{error}</p>
  {:else if helpText}
    <p id="{id}-description" class="select-help-text">{helpText}</p>
  {/if}
</div>

<style>
  .select-wrapper {
    width: 100%;
    font-family: var(--font-primary);
  }

  .select-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .select-required {
    color: var(--error);
    margin-left: var(--space-0-5);
  }

  .select-container {
    position: relative;
  }

  .select {
    width: 100%;
    height: 2.5rem;
    padding: var(--space-2) var(--space-3);
    padding-right: var(--space-8);
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--bg-default);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    appearance: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .select:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px var(--primary-lightest);
    outline: none;
  }

  .select-icon {
    position: absolute;
    top: 50%;
    right: var(--space-3);
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-secondary);
  }

  .select-icon svg {
    width: 1rem;
    height: 1rem;
  }

  .select-disabled {
    background-color: var(--bg-subtle);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .select-error {
    border-color: var(--error);
  }

  .select-error:focus {
    box-shadow: 0 0 0 2px var(--error-light);
  }

  .select-error-message {
    font-size: var(--text-sm);
    color: var(--error);
    margin-top: var(--space-1);
  }

  .select-help-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-top: var(--space-1);
  }
</style>