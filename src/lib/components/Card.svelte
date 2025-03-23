<script lang="ts">
  import { fetchCard } from '$lib/utils/scryfall';
  import CardImage from '$lib/components/ui/CardImage.svelte';

  interface Card {
    id?: string;  // Added id property to fix the error
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

<div class="w-full max-w-7xl mx-auto p-4">
  <div class="card-search">
    <form 
      on:submit|preventDefault={searchCard}
      role="search"
      aria-label="Search for Magic cards"
    >
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg aria-hidden="true" class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="search" 
          id="cardSearch"
          bind:value={cardName} 
          on:keypress={handleKeyPress}
          placeholder="Enter card name" 
          class="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm sm:text-base shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Card name search"
          aria-describedby="searchHelp"
        />
      </div>
      <div id="searchHelp" class="sr-only">
        Press enter or click the search button to find a card
      </div>
      <button 
        type="submit"
        class="mt-3 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        disabled={loading}
        aria-label={loading ? "Searching for card..." : "Search for card"}
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Searching...</span>
        {:else}
          <span>Search</span>
        {/if}
      </button>
    </form>

    {#if error}
      <div 
        class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md"
        role="alert"
        aria-live="polite"
      >
        <p class="text-sm text-red-600">{error}</p>
      </div>
    {/if}

    {#if cardData}
      <div 
        class="mt-6 bg-white shadow rounded-lg overflow-hidden"
        role="region"
        aria-label="Card details"
      >
        <div class="p-6">
          <div class="flex flex-col sm:flex-row gap-6">
            {#if cardData.image_uris?.normal}
              <div class="w-full sm:w-1/3">
                <CardImage 
                  cardId={cardData.id || cardData.name}
                  imageUrl={cardData.image_uris.normal} 
                  altText={`${cardData.name} card illustration`}
                  loading="lazy"
                  fetchPriority="high"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 488px"
                  decoding="async"
                  class="w-full rounded-lg shadow-sm"
                />
              </div>
            {/if}
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900">{cardData.name}</h2>
              {#if cardData.mana_cost}
                <p class="mt-1 text-gray-600">Mana Cost: {cardData.mana_cost}</p>
              {/if}
              {#if cardData.type_line}
                <p class="mt-1 text-gray-600">Type: {cardData.type_line}</p>
              {/if}
              {#if cardData.rarity}
                <p class="mt-1 text-gray-600">Rarity: {cardData.rarity}</p>
              {/if}
              {#if cardData.set_name}
                <p class="mt-1 text-gray-600">Set: {cardData.set_name}</p>
              {/if}
              {#if cardData.oracle_text}
                <div class="mt-4">
                  <h3 class="text-sm font-medium text-gray-900">Card Text</h3>
                  <p class="mt-1 text-gray-600 whitespace-pre-line">{cardData.oracle_text}</p>
                </div>
              {/if}
              <div class="mt-6 flex flex-wrap gap-3">
                <button 
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Add {cardData.name} to collection"
                >
                  <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add to Collection
                </button>
                <button 
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Add {cardData.name} to deck"
                >
                  <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012 2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Add to Deck
                </button>
              </div>
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
