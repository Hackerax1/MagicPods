<script lang="ts">
  import CardSearch from './CardSearch.svelte';
  import DeckInfo from './DeckInfo.svelte';
  import DeckList from './DeckList.svelte';
  import DeckStats from './DeckStats.svelte';
  import DeckExport from './DeckExport.svelte';
  import DeckTabs from './DeckTabs.svelte';
  import { getCardImageUrls } from '$lib/utils/image-optimizer';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

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

  let deck: Card[] = [];
  let deckName = 'Untitled Deck';
  let deckDescription = '';
  let savingDeck = false;
  let error = '';
  let currentTab = 'builder';
  let sortOption = 'type';
  let searchResults: Card[] = [];
  let isDragging = false;

  const handleCardFound = (card: Card) => {
    // Add a unique ID if not present
    if (!card.id) {
      card.id = crypto.randomUUID();
    }
    
    // Add to search results if not already there
    const existingCardIndex = searchResults.findIndex(c => c.name === card.name);
    if (existingCardIndex < 0) {
      searchResults = [...searchResults, { ...card }];
    }
  };

  const handleAddToDeck = (card: Card) => {
    const existingCardIndex = deck.findIndex(c => c.name === card.name);
      
    if (existingCardIndex >= 0) {
      const newDeck = [...deck];
      newDeck[existingCardIndex].quantity = (newDeck[existingCardIndex].quantity || 1) + 1;
      deck = newDeck;
    } else {
      // Ensure card has an ID for drag and drop
      const cardWithId = { 
        ...card, 
        quantity: 1, 
        id: card.id || crypto.randomUUID() 
      };
      deck = [...deck, cardWithId];
    }
  };

  const handleAddCard = (card: Card) => {
    deck = deck.map(c => c === card ? { ...c, quantity: (c.quantity || 1) + 1 } : c);
  };

  const handleRemoveCard = (card: Card) => {
    if (card.quantity && card.quantity > 1) {
      deck = deck.map(c => c === card ? { ...c, quantity: (c.quantity || 1) - 1 } : c);
    } else {
      deck = deck.filter((c) => c !== card);
    }
  };

  const handleSaveDeck = async () => {
    if (deckName.trim() === '') {
      error = 'Please enter a deck name';
      return;
    }
    
    savingDeck = true;
    
    try {
      // Simulate API call to save deck
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saved deck:', { name: deckName, description: deckDescription, cards: deck });
      
      savingDeck = false;
      error = '';
      alert('Deck saved successfully!');
    } catch (err) {
      console.error('Error saving deck:', err);
      error = 'Failed to save deck. Please try again.';
      savingDeck = false;
    }
  };

  // DnD handlers for search results
  function handleDndConsiderSearchResults(e: CustomEvent<any>) {
    isDragging = true;
    searchResults = e.detail.items;
  }

  function handleDndFinalizeSearchResults(e: CustomEvent<any>) {
    isDragging = false;
    searchResults = e.detail.items;
  }

  // DnD handlers for deck
  function handleDndConsiderDeck(e: CustomEvent<any>) {
    isDragging = true;
    deck = e.detail.items;
  }

  function handleDndFinalizeDeck(e: CustomEvent<any>) {
    isDragging = false;
    
    // Check if item was dropped from search results
    const { items, info } = e.detail;
    
    if (info.source === 'search-results' && info.trigger === 'droppedInto') {
      // Find the card that was dropped
      const droppedCard = searchResults.find(card => card.id === info.id);
      if (droppedCard) {
        handleAddToDeck(droppedCard);
        return;
      }
    }
    
    deck = items;
  }

  // Clear search results
  function clearSearchResults() {
    searchResults = [];
  }
</script>

<div class="min-h-screen max-w-[1920px] mx-auto p-4">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="bg-indigo-700 text-white p-4">
      <h1 class="text-2xl font-bold">Deck Builder</h1>
    </div>
    
    <DeckTabs bind:currentTab />
    
    {#if currentTab === 'builder'}
      <div class="p-4">
        <div class="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <!-- Left Column -->
          <div class="xl:col-span-1">
            <div class="sticky top-4 space-y-6">
              <CardSearch onCardFound={handleCardFound} />
              
              <!-- Search Results with Drag and Drop -->
              {#if searchResults.length > 0}
                <div class="bg-white p-4 rounded-lg shadow-md">
                  <div class="flex justify-between items-center mb-3">
                    <h3 class="font-medium text-gray-900">Search Results</h3>
                    <button 
                      on:click={clearSearchResults}
                      class="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div class="max-h-96 overflow-y-auto pr-1 search-results-container">
                    <section
                      use:dndzone={{items: searchResults, type: 'search-results', dropTargetStyle: {outline: 'none'}}}
                      on:consider={handleDndConsiderSearchResults}
                      on:finalize={handleDndFinalizeSearchResults}
                      class="grid grid-cols-1 gap-2"
                    >
                      {#each searchResults as card (card.id)}
                        <div animate:flip={{duration: 200}} class="search-result-card">
                          <div class="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200 hover:border-indigo-300 transition-colors cursor-move">
                            <div class="flex-shrink-0 mr-3 w-12">
                              {#if card.image_uris?.art_crop}
                                <img 
                                  src={getCardImageUrls(card.image_uris.art_crop).art_crop} 
                                  alt={card.name} 
                                  class="w-full h-10 object-cover rounded shadow-sm"
                                  loading="lazy"
                                  fetchpriority="low"
                                />
                              {/if}
                            </div>
                            <div class="flex-1 min-w-0 pr-2">
                              <p class="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                              <p class="text-xs text-gray-500 truncate">{card.type_line}</p>
                            </div>
                            <button 
                              on:click={() => handleAddToDeck(card)}
                              class="p-1 rounded-full text-gray-400 hover:text-green-500 focus:outline-none"
                              title="Add to deck"
                              aria-label="Add to deck"
                            >
                              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      {/each}
                    </section>
                    <div class="text-xs text-gray-500 mt-2 italic">Drag cards to your deck or click the + button</div>
                  </div>
                </div>
              {/if}
              
              <DeckInfo
                bind:deckName
                bind:deckDescription
                bind:savingDeck
                bind:error
                onSave={handleSaveDeck}
              />
            </div>
          </div>
          
          <!-- Right Column -->
          <div class="xl:col-span-2 2xl:col-span-3">
            <DeckList
              {deck}
              bind:sortOption
              onRemoveCard={handleRemoveCard}
              onAddCard={handleAddCard}
              {isDragging}
              on:consider={handleDndConsiderDeck}
              on:finalize={handleDndFinalizeDeck}
            />
          </div>
        </div>
      </div>
    {:else if currentTab === 'stats'}
      <DeckStats {deck} />
    {:else if currentTab === 'export'}
      <DeckExport {deck} />
    {/if}
  </div>
</div>

<style>
  .search-results-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  
  .search-results-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .search-results-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .search-results-container::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  
  .search-result-card {
    touch-action: none;
  }
</style>
