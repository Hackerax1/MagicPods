<script lang="ts">
  export let deckName = 'Untitled Deck';
  export let deckDescription = '';
  export let savingDeck = false;
  export let error = '';
  export let onSave: () => Promise<void>;

  const handleSave = async () => {
    if (deckName.trim() === '') {
      error = 'Please enter a deck name';
      return;
    }
    await onSave();
  };
</script>

<div class="bg-gray-50 p-4 rounded-md w-full">
  <h2 class="text-lg font-medium text-gray-900 mb-3">Deck Information</h2>
  
  <div class="space-y-4">
    <div>
      <label for="deck-name" class="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
      <input 
        type="text" 
        id="deck-name"
        bind:value={deckName} 
        placeholder="Enter deck name" 
        class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
    
    <div>
      <label for="deck-description" class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
      <textarea 
        id="deck-description"
        bind:value={deckDescription} 
        rows="3"
        placeholder="Enter deck description" 
        class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      ></textarea>
    </div>
    
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    
    <button 
      on:click={handleSave}
      class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      disabled={savingDeck}
    >
      {#if savingDeck}
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      {:else}
        Save Deck
      {/if}
    </button>
  </div>
</div>