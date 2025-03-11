<script lang="ts">
  // Props
  export let title: string = '';
  export let subtitle: string = '';
  export let elevation: 'flat' | 'raised' | 'elevated' = 'raised';
  export let padding: 'none' | 'small' | 'default' | 'large' = 'default';
  export let borderColor: string | undefined = undefined;
</script>

<div
  class={`
    bg-white overflow-hidden rounded-lg 
    ${elevation === 'flat' ? '' : elevation === 'raised' ? 'shadow-md' : 'shadow-lg'} 
    ${borderColor ? `border-l-4 border-${borderColor}` : ''} 
    ${padding === 'none' ? '' : padding === 'small' ? 'p-3' : padding === 'default' ? 'p-4 sm:p-6' : 'p-6 sm:p-8'}
  `}
  role="article"
  {...$$restProps}
>
  {#if title}
    <div class={padding === 'none' ? 'p-4 pb-0' : ''}>
      <h3 class="text-lg font-medium text-gray-900 {subtitle ? 'mb-1' : 'mb-4'}">{title}</h3>
      {#if subtitle}
        <p class="text-sm text-gray-500 mb-4">{subtitle}</p>
      {/if}
    </div>
  {/if}
  
  <div class={title && padding === 'none' ? 'p-4 pt-0' : ''}>
    <slot />
  </div>
  
  {#if $$slots.footer}
    <div class={`
      ${padding === 'none' ? 'px-4 py-3' : 'mt-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6'} 
      bg-gray-50 border-t border-gray-200 px-4 py-3 sm:px-6
    `}>
      <slot name="footer" />
    </div>
  {/if}
</div>