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

<div class="min-h-screen bg-gray-50">
  <div class="w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <!-- Search Section -->
    <div class="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 class="text-xl sm:text-2xl font-bold mb-4 text-indigo-800">Find a Card</h2>
      
      <div class="flex flex-col sm:flex-row gap-2">
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
            class="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm sm:text-base shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button 
          on:click={searchCard} 
          class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto w-full disabled:opacity-50"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          {:else}
            <svg class="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

    <!-- Card Display Section -->
    {#if loading}
      <div class="flex justify-center items-center py-8">
        <div class="animate-pulse flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl">
          <div class="w-64 h-89 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 space-y-4 w-full">
            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded w-5/6"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if cardData && !loading}
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-start gap-6 p-4 sm:p-6">
          <!-- Card Image -->
          <div class="w-full md:w-auto flex justify-center">
            <div class="relative group w-full max-w-sm md:max-w-xs">
              <img 
                src={cardData.image_uris.normal} 
                alt={cardData.name}
                class="rounded-lg shadow-sm hover:shadow-lg transition-shadow w-full h-auto object-contain"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-lg flex items-center justify-center">
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

          <!-- Card Details -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900">{cardData.name}</h2>
              {#if cardData.mana_cost}
                <span class="text-lg sm:text-xl text-gray-600">{cardData.mana_cost}</span>
              {/if}
            </div>

            {#if cardData.type_line}
              <p class="text-gray-600 italic mb-4 text-sm sm:text-base">{cardData.type_line}</p>
            {/if}

            <div class="bg-gray-50 rounded-md p-3 sm:p-4 mb-4">
              <p class="whitespace-pre-line text-gray-800 text-sm sm:text-base">{cardData.oracle_text}</p>
            </div>

            <div class="flex flex-wrap gap-2 mb-6">
              {#if cardData.rarity}
                <span class="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs sm:text-sm capitalize">
                  {cardData.rarity}
                </span>
              {/if}
              {#if cardData.set_name}
                <span class="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm">
                  {cardData.set_name}
                </span>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button class="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm sm:text-base flex items-center justify-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Collection
              </button>
              <button class="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base flex items-center justify-center">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Add to Deck
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Remove custom scrollbar styles as they're not needed with the new layout */
</style>
