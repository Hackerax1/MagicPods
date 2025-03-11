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

<div class="w-full">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {#if required}<span class="text-red-500">*</span>{/if}
    </label>
  {/if}
  
  <div class="relative rounded-md shadow-sm">
    {#if icon}
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      class={`
        block w-full rounded-md 
        ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 
        border ${error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} 
        ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} 
        text-sm shadow-sm transition-colors
      `}
      {autocomplete}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${id}-error` : helpText ? `${id}-description` : undefined}
      {...$$restProps}
    />
  </div>
  
  {#if error}
    <p id="{id}-error" class="mt-1 text-sm text-red-600" role="alert">{error}</p>
  {:else if helpText}
    <p id="{id}-description" class="mt-1 text-sm text-gray-500">{helpText}</p>
  {/if}
</div>