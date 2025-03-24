<script lang="ts">
  import { onMount } from 'svelte';
  import { offlineStatus, isSyncPending, syncOfflineChanges } from '$lib/utils/offline';
  
  // Local state for animation
  let visible = false;
  let animationState = 'idle';
  
  onMount(() => {
    // Make the component visible after a short delay
    setTimeout(() => {
      visible = true;
    }, 500);
    
    // Add a listener for online/offline status changes
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);
    
    return () => {
      window.removeEventListener('online', handleNetworkStatusChange);
      window.removeEventListener('offline', handleNetworkStatusChange);
    };
  });
  
  function handleNetworkStatusChange() {
    // Animate the indicator when network status changes
    animationState = 'active';
    setTimeout(() => {
      animationState = 'idle';
    }, 2000);
  }
  
  function handleSyncClick() {
    syncOfflineChanges();
  }
</script>

{#if visible}
  <div 
    class="fixed bottom-4 right-4 z-50 transition-transform duration-300 ease-in-out"
    class:translate-y-0={$offlineStatus !== 'online'}
    class:translate-y-24={$offlineStatus === 'online'}
    class:animate-pulse={animationState === 'active'}
    role="status"
    aria-live="polite"
  >
    {#if $offlineStatus === 'offline-with-changes'}
      <!-- Offline with pending changes -->
      <div class="bg-yellow-100 text-yellow-800 border border-yellow-400 rounded-lg shadow-lg px-4 py-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>You're offline with unsaved changes</span>
        {#if $isSyncPending}
          <div class="ml-2 animate-spin h-4 w-4 border-2 border-yellow-600 rounded-full border-t-transparent"></div>
        {:else}
          <button 
            on:click={handleSyncClick}
            class="ml-2 text-yellow-700 hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded-md"
          >
            Retry
          </button>
        {/if}
      </div>
    {:else if $offlineStatus === 'offline'}
      <!-- Offline with no changes -->
      <div class="bg-gray-100 text-gray-700 border border-gray-300 rounded-lg shadow-lg px-4 py-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <span>You're offline</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .translate-y-24 {
    transform: translateY(6rem);
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .animate-pulse {
    animation: pulse 1s ease-in-out;
  }
</style>