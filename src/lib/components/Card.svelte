<script lang="ts">
  import { fetchCard } from '$lib/utils/scryfall';

  interface Card {
    name: string;
    image_uris: {
      normal: string;
      small: string;
      art_crop: string;
    };
    oracle_text: string;
    mana_cost?: string;
    type_line?: string;
    rarity?: string;
    set_name?: string;
  }

  let cardName = '';
  let cardData: Card | null = null;
  let loading = false;
  let error = '';

  const searchCard = async () => {
    if (!cardName.trim()) {
      error = 'Please enter a card name';
      return;
    }

    loading = true;
    error = '';
    
    try {
      cardData = await fetchCard(cardName);
    } catch (err) {
      console.error('Error fetching card:', err);
      error = 'Card not found. Please check the spelling and try again.';
      cardData = null;
    } finally {
      loading = false;
    }
  };

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      searchCard();
    }
  }
</script>

<div class="card-search-container w-full max-w-xl mx-auto px-4 sm:px-6">
  <div class="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
    <h2 class="text-xl sm:text-2xl font-bold mb-4 text-indigo-800">Find a Card</h2>
    
    <div class="mb-4">
      <label for="cardSearch" class="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-0">
        <div class="relative flex-grow">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            id="cardSearch"
            bind:value={cardName} 
            on:keypress={handleKeyPress}
            placeholder="Enter card name" 
            class="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button 
          on:click={searchCard} 
          class="w-full sm:w-auto sm:ml-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          {:else}
            <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          {/if}
        </button>
      </div>

      {#if error}
        <p class="mt-2 text-sm text-red-600">{error}</p>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-8 sm:py-12">
      <div class="animate-pulse flex flex-col items-center">
        <div class="w-36 sm:w-48 h-48 sm:h-64 bg-gray-300 rounded mb-4"></div>
        <div class="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  {/if}

  {#if cardData && !loading}
    <div class="card-display bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <div class="flex flex-col lg:flex-row lg:items-start gap-6">
        <div class="w-full lg:w-1/2 flex justify-center">
          <div class="relative group w-full max-w-xs">
            <img 
              src={cardData.image_uris.normal} 
              alt={cardData.name} 
              class="rounded-lg shadow-sm hover:shadow-lg transition-shadow w-full h-auto object-contain"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-opacity rounded-lg">
              <a 
                href={cardData.image_uris.normal} 
                target="_blank" 
                rel="noopener noreferrer"
                class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-opacity transform hover:scale-105"
              >
                View Full Size
              </a>
            </div>
          </div>
        </div>
        
        <div class="w-full lg:w-1/2">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h2 class="text-xl sm:text-2xl font-bold text-indigo-900">{cardData.name}</h2>
            {#if cardData.mana_cost}
              <span class="text-lg sm:text-xl text-gray-600">{cardData.mana_cost}</span>
            {/if}
          </div>
          
          {#if cardData.type_line}
            <p class="text-gray-600 italic mb-4">{cardData.type_line}</p>
          {/if}
          
          <div class="bg-gray-50 rounded-md p-3 sm:p-4 mb-4">
            <p class="whitespace-pre-line text-gray-800 text-sm sm:text-base">{cardData.oracle_text}</p>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-4">
            {#if cardData.rarity}
              <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{cardData.rarity}</span>
            {/if}
            {#if cardData.set_name}
              <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{cardData.set_name}</span>
            {/if}
          </div>
          
          <div class="mt-6 flex flex-col sm:flex-row gap-3">
            <button class="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm sm:text-base">
              Add to Collection
            </button>
            <button class="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm sm:text-base">
              Add to Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for card details */
  :global(.card-display) {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
  }
  
  :global(.card-display::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(.card-display::-webkit-scrollbar-track) {
    background: #f3f4f6;
  }
  
  :global(.card-display::-webkit-scrollbar-thumb) {
    background-color: #d1d5db;
    border-radius: 6px;
  }
</style>
