<script lang="ts">
  import { fetchCard } from '$lib/utils/scryfall';

  interface Card {
    id?: string;
    name: string;
    type_line: string;
    image_uris: {
      normal: string;
      small: string;
      art_crop: string;
    };
    cmc?: number;
    mana_cost?: string;
    rarity?: string;
    set_name?: string;
    quantity?: number;
  }

  let cardName = '';
  let cardData: Card | null = null;
  let loading = false;
  let error = '';
  let showCardView = false;

  export let onCardFound = (card: Card) => {};

  const handleSearch = async () => {
    if (!cardName.trim()) {
      error = 'Please enter a card name';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      cardData = await fetchCard(cardName);
      showCardView = true;
    } catch (err) {
      console.error('Error fetching card:', err);
      error = 'Card not found. Please check the spelling and try again.';
      cardData = null;
    } finally {
      loading = false;
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToDeck = () => {
    if (cardData) {
      onCardFound(cardData);
      cardData = null;
      cardName = '';
      showCardView = false;
    }
  };
</script>

<div class="bg-gray-50 p-4 rounded-md">
  <h2 class="text-lg font-medium text-gray-900 mb-3">Add Cards</h2>
  
  <div class="mb-4">
    <label for="card-search" class="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
    <div class="flex">
      <div class="relative flex-grow">
        <input 
          type="text" 
          id="card-search"
          bind:value={cardName} 
          on:keypress={handleKeyPress}
          placeholder="Enter card name" 
          class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <button 
        on:click={handleSearch} 
        class="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {:else}
          Search
        {/if}
      </button>
    </div>
    {#if error}
      <p class="mt-2 text-sm text-red-600">{error}</p>
    {/if}
  </div>
  
  {#if showCardView && cardData}
    <div class="mt-4 border border-gray-200 rounded-md p-3">
      <div class="flex flex-col sm:flex-row items-center">
        <img 
          src={cardData.image_uris.small} 
          alt={cardData.name} 
          class="w-24 rounded shadow-sm mb-3 sm:mb-0 sm:mr-3"
        />
        <div class="flex-1">
          <h3 class="font-medium">{cardData.name}</h3>
          <p class="text-sm text-gray-600 mb-2">{cardData.type_line}</p>
          <button 
            on:click={handleAddToDeck}
            class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add to Deck
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>