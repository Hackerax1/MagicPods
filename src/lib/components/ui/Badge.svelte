<script lang="ts">
  // Props
  export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let rounded: boolean = true;
  export let outline: boolean = false;
  
  // Define variant classes
  const variantClasses = {
    primary: outline 
      ? 'bg-transparent text-indigo-600 border border-indigo-600' 
      : 'bg-indigo-100 text-indigo-800',
    secondary: outline 
      ? 'bg-transparent text-blue-600 border border-blue-600' 
      : 'bg-blue-100 text-blue-800',
    success: outline 
      ? 'bg-transparent text-green-600 border border-green-600' 
      : 'bg-green-100 text-green-800',
    warning: outline 
      ? 'bg-transparent text-amber-600 border border-amber-600' 
      : 'bg-amber-100 text-amber-800',
    error: outline 
      ? 'bg-transparent text-red-600 border border-red-600' 
      : 'bg-red-100 text-red-800',
    info: outline 
      ? 'bg-transparent text-sky-600 border border-sky-600' 
      : 'bg-sky-100 text-sky-800',
    default: outline 
      ? 'bg-transparent text-gray-600 border border-gray-600' 
      : 'bg-gray-100 text-gray-800'
  };
  
  // Define size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };
  
  // Construct class string
  const classes = `
    inline-flex items-center font-medium
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${rounded ? 'rounded-full' : 'rounded'}
  `;
</script>

<span class={classes} {...$$restProps}>
  <slot />
</span>