<script lang="ts">
  // Props
  export let id: string;
  export let type: string = 'text';
  export let label: string = '';
  export let value: string = '';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: string = '';
  export let helpText: string = '';
  export let name: string = id;
  export let autocomplete: 'on' | 'off' | 'name' | 'email' | 'username' | 'new-password' | 'current-password' | 'one-time-code' | 'organization-title' | 'organization' | 'street-address' | 'address-line1' | 'address-line2' | 'address-line3' | 'address-level1' | 'address-level2' | 'address-level3' | 'country' | 'country-name' | 'postal-code' | 'cc-name' | 'cc-given-name' | 'cc-additional-name' | 'cc-family-name' | 'cc-number' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year' | 'cc-csc' | 'cc-type' | 'transaction-currency' | 'transaction-amount' | 'language' | 'bday' | 'bday-day' | 'bday-month' | 'bday-year' | 'sex' | 'tel' | 'tel-country-code' | 'tel-national' | 'tel-area-code' | 'tel-local' | 'tel-extension' | 'url' | 'photo' = 'off';
  export let icon: string | undefined = undefined;
</script>

<div class="input-wrapper">
  {#if label}
    <label for={id} class="input-label">
      {label}
      {#if required}<span class="input-required">*</span>{/if}
    </label>
  {/if}
  
  <div class="input-container">
    {#if icon}
      <div class="input-icon">
        <svg class="input-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon} />
        </svg>
      </div>
    {/if}
    
    <input
      {id}
      {name}
      bind:value
      {type}
      {placeholder}
      {disabled}
      {required}
      class="input {error ? 'input-error' : ''} {icon ? 'input-with-icon' : ''} {disabled ? 'input-disabled' : ''}"
      {autocomplete}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : helpText ? `${id}-description` : undefined}
      {...$$restProps}
    />
  </div>
  
  {#if error}
    <p id="{id}-error" class="input-error-message" role="alert">{error}</p>
  {:else if helpText}
    <p id="{id}-description" class="input-help-text">{helpText}</p>
  {/if}
</div>

<style>
  .input-wrapper {
    width: 100%;
    font-family: var(--font-primary);
  }

  .input-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .input-required {
    color: var(--error);
    margin-left: var(--space-0-5);
  }

  .input-container {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: var(--text-secondary);
  }

  .input-icon-svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .input {
    width: 100%;
    height: 2.5rem;
    padding: 0 var(--space-3);
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--bg-default);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .input-with-icon {
    padding-left: 2.5rem;
  }

  .input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px var(--primary-lightest);
  }

  .input-disabled {
    background-color: var(--bg-subtle);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .input-error {
    border-color: var(--error);
  }

  .input-error:focus {
    box-shadow: 0 0 0 2px var(--error-light);
  }

  .input-error-message {
    font-size: var(--text-sm);
    color: var(--error);
    margin-top: var(--space-1);
  }

  .input-help-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-top: var(--space-1);
  }

  /* Special input types */
  input[type="date"],
  input[type="datetime-local"],
  input[type="month"],
  input[type="time"],
  input[type="week"] {
    min-height: 2.5rem;
  }

  input[type="color"] {
    min-height: 2.5rem;
    padding: var(--space-1);
  }

  /* For better accessibility */
  @media (prefers-reduced-motion: reduce) {
    .input {
      transition: none;
    }
  }
</style>