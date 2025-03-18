<script lang="ts">
  import { keyboardManager } from '$lib/utils/keyboard';
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from './Button.svelte';
  import Modal from './Modal.svelte';

  export let showHelp = false;
  
  const dispatch = createEventDispatcher();
  let shortcuts: { key: string; modifiers: string; description: string }[] = [];
  
  onMount(() => {
    shortcuts = keyboardManager.getShortcuts();
  });

  function closeModal() {
    dispatch('close');
  }
</script>

<Modal {showHelp} on:close={closeModal}>
  <svelte:fragment slot="header">Keyboard Shortcuts</svelte:fragment>
  
  <div class="p-4 max-h-[70vh] overflow-y-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 class="font-medium text-lg mb-2">Navigation</h3>
        <ul class="space-y-2">
          {#each shortcuts.filter(s => s.description.includes('navigate') || s.description.includes('tab')) as shortcut}
            <li class="flex justify-between">
              <span>{shortcut.description}</span>
              <kbd class="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {#if shortcut.modifiers}
                  <span class="text-indigo-600">{shortcut.modifiers}</span> + 
                {/if}
                <span>{shortcut.key}</span>
              </kbd>
            </li>
          {/each}
        </ul>
      </div>
      
      <div>
        <h3 class="font-medium text-lg mb-2">Card Actions</h3>
        <ul class="space-y-2">
          {#each shortcuts.filter(s => s.description.includes('card') || s.description.includes('deck')) as shortcut}
            <li class="flex justify-between">
              <span>{shortcut.description}</span>
              <kbd class="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {#if shortcut.modifiers}
                  <span class="text-indigo-600">{shortcut.modifiers}</span> + 
                {/if}
                <span>{shortcut.key}</span>
              </kbd>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <h3 class="font-medium text-lg mb-2">General</h3>
        <ul class="space-y-2">
          {#each shortcuts.filter(s => !s.description.includes('navigate') && !s.description.includes('tab') && !s.description.includes('card') && !s.description.includes('deck')) as shortcut}
            <li class="flex justify-between">
              <span>{shortcut.description}</span>
              <kbd class="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {#if shortcut.modifiers}
                  <span class="text-indigo-600">{shortcut.modifiers}</span> + 
                {/if}
                <span>{shortcut.key}</span>
              </kbd>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
  
  <svelte:fragment slot="footer">
    <Button variant="primary" on:click={closeModal}>Close</Button>
  </svelte:fragment>
</Modal>

<style>
  kbd {
    font-family: 'Courier New', monospace;
    box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #d1d5db;
  }
</style>