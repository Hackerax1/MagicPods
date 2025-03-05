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
  let deck: Card[] = [];
  let loading = false;
  let error = '';
  let deckName = 'Untitled Deck';
  let deckDescription = '';
  let savingDeck = false;
  let showCardView = false;
  let currentTab = 'builder'; // 'builder', 'stats', 'export'
  let sortOption = 'type';    // 'type', 'cmc', 'name'
  
  // For stats tracking
  $: deckSize = deck.reduce((acc, card) => acc + (card.quantity || 1), 0);
  $: typeCount = countByType(deck);
  $: avgCmc = calculateAvgCmc(deck);
  
  function countByType(cards: Card[]) {
    return cards.reduce((acc, card) => {
      const type = getMainType(card.type_line);
      if (!acc[type]) acc[type] = 0;
      acc[type] += card.quantity || 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  function calculateAvgCmc(cards: Card[]) {
    if (cards.length === 0) return 0;
    const totalCmc = cards.reduce((acc, card) => 
      acc + ((card.cmc || 0) * (card.quantity || 1)), 0);
    const totalCards = cards.reduce((acc, card) => 
      acc + (card.quantity || 1), 0);
    return totalCmc / totalCards;
  }
  
  function getMainType(type_line: string): string {
    if (type_line.includes('Land')) return 'Land';
    if (type_line.includes('Creature')) return 'Creature';
    if (type_line.includes('Instant')) return 'Instant';
    if (type_line.includes('Sorcery')) return 'Sorcery';
    if (type_line.includes('Artifact')) return 'Artifact';
    if (type_line.includes('Enchantment')) return 'Enchantment';
    if (type_line.includes('Planeswalker')) return 'Planeswalker';
    return 'Other';
  }

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

  const handleAddToDeck = () => {
    if (cardData) {
      // Check if card already exists in deck
      const existingCardIndex = deck.findIndex(c => c.name === cardData?.name);
      
      if (existingCardIndex >= 0) {
        // Increment quantity if card already exists
        const newDeck = [...deck];
        newDeck[existingCardIndex].quantity = (newDeck[existingCardIndex].quantity || 1) + 1;
        deck = newDeck;
      } else {
        // Add new card with quantity 1
        deck = [...deck, { ...cardData, quantity: 1 }];
      }
      
      // Reset card search
      cardData = null;
      cardName = '';
      showCardView = false;
    }
  };

  const handleRemoveFromDeck = (card: Card) => {
    if (card.quantity && card.quantity > 1) {
      // Decrement quantity if more than 1
      deck = deck.map(c => c === card ? { ...c, quantity: (c.quantity || 1) - 1 } : c);
    } else {
      // Remove card completely if quantity is 1
      deck = deck.filter((c) => c !== card);
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleAddOneMore = (card: Card) => {
    deck = deck.map(c => c === card ? { ...c, quantity: (c.quantity || 1) + 1 } : c);
  };

  const saveDeck = async () => {
    if (deckName.trim() === '') {
      error = 'Please enter a deck name';
      return;
    }
    
    savingDeck = true;
    
    try {
      // Simulate API call to save deck
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saved deck:', { name: deckName, description: deckDescription, cards: deck });
      
      // Show success message or redirect
      savingDeck = false;
      error = '';
      alert('Deck saved successfully!');
    } catch (err) {
      console.error('Error saving deck:', err);
      error = 'Failed to save deck. Please try again.';
      savingDeck = false;
    }
  };
  
  const sortedDeck = () => {
    if (sortOption === 'type') {
      return groupByType(deck);
    } else if (sortOption === 'cmc') {
      return groupByCmc(deck);
    } else {
      return groupByName(deck);
    }
  };
  
  const groupByType = (cards: Card[]) => {
    return cards.reduce((acc, card) => {
      const type = getMainType(card.type_line);
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(card);
      return acc;
    }, {} as Record<string, Card[]>);
  };
  
  const groupByCmc = (cards: Card[]) => {
    return cards.reduce((acc, card) => {
      const cmc = card.cmc !== undefined ? Math.floor(card.cmc).toString() : 'Unknown';
      if (!acc[cmc]) {
        acc[cmc] = [];
      }
      acc[cmc].push(card);
      return acc;
    }, {} as Record<string, Card[]>);
  };
  
  const groupByName = (cards: Card[]) => {
    const sorted = [...cards].sort((a, b) => a.name.localeCompare(b.name));
    return { "All Cards": sorted } as Record<string, Card[]>;
  };
</script>

<div class="deck-builder-container">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="bg-indigo-700 text-white p-4">
      <h1 class="text-2xl font-bold">Deck Builder</h1>
    </div>
    
    <!-- Tabs -->
    <div class="flex border-b border-gray-200">
      <button 
        class={`px-4 py-2 font-medium text-sm flex-grow ${currentTab === 'builder' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} 
        on:click={() => currentTab = 'builder'}
      >
        Builder
      </button>
      <button 
        class={`px-4 py-2 font-medium text-sm flex-grow ${currentTab === 'stats' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} 
        on:click={() => currentTab = 'stats'}
      >
        Statistics
      </button>
      <button 
        class={`px-4 py-2 font-medium text-sm flex-grow ${currentTab === 'export' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} 
        on:click={() => currentTab = 'export'}
      >
        Export
      </button>
    </div>
    
    <!-- Builder Tab -->
    {#if currentTab === 'builder'}
      <div class="p-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Card Search -->
          <div class="lg:col-span-1 space-y-6">
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
            
            <!-- Deck Info -->
            <div class="bg-gray-50 p-4 rounded-md">
              <h2 class="text-lg font-medium text-gray-900 mb-3">Deck Information</h2>
              
              <div class="mb-4">
                <label for="deck-name" class="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
                <input 
                  type="text" 
                  id="deck-name"
                  bind:value={deckName} 
                  placeholder="Enter deck name" 
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div class="mb-4">
                <label for="deck-description" class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea 
                  id="deck-description"
                  bind:value={deckDescription} 
                  rows="3"
                  placeholder="Enter deck description" 
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              
              <button 
                on:click={saveDeck}
                class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
          
          <!-- Right Column: Deck Display -->
          <div class="lg:col-span-2">
            <div class="bg-gray-50 p-4 rounded-md">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-medium text-gray-900">Current Deck ({deckSize} cards)</h2>
                
                <div class="flex items-center space-x-2">
                  <label for="sort-option" class="text-sm text-gray-600">Sort by:</label>
                  <select 
                    id="sort-option" 
                    bind:value={sortOption}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="type">Type</option>
                    <option value="cmc">Mana Value</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
              
              {#if deck.length === 0}
                <div class="text-center py-10 bg-white rounded-md border border-gray-200">
                  <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p class="mt-2 text-sm text-gray-500">No cards in your deck yet</p>
                  <p class="text-sm text-gray-500">Search for cards to add them to your deck</p>
                </div>
              {:else}
                <div class="space-y-6">
                  {#each Object.entries(sortedDeck()) as [category, cards]}
                    <div>
                      <h3 class="font-medium text-gray-900 mb-2 flex items-center">
                        {category}
                        <span class="ml-2 text-sm text-gray-500">({cards.length} {cards.length === 1 ? 'card' : 'cards'})</span>
                      </h3>
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {#each cards as card}
                          <div class="flex items-center bg-white p-2 rounded-md border border-gray-200 hover:border-indigo-300 transition-colors">
                            <div class="flex-shrink-0 mr-3">
                              {#if card.image_uris?.art_crop}
                                <img 
                                  src={card.image_uris.art_crop} 
                                  alt={card.name} 
                                  class="h-12 w-16 object-cover rounded shadow-sm"
                                />
                              {/if}
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                              <p class="text-xs text-gray-500 truncate">{card.type_line}</p>
                            </div>
                            <div class="flex items-center space-x-1">
                              <button 
                                on:click={() => handleRemoveFromDeck(card)}
                                class="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                                title="Remove one"
                              >
                                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                                </svg>
                              </button>
                              <span class="text-sm font-medium">{card.quantity || 1}</span>
                              <button 
                                on:click={() => handleAddOneMore(card)}
                                class="p-1 rounded-full text-gray-400 hover:text-green-500 focus:outline-none"
                                title="Add one more"
                              >
                                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Stats Tab -->
    {#if currentTab === 'stats'}
      <div class="p-6">
        <h2 class="text-xl font-bold mb-4">Deck Statistics</h2>
        
        {#if deck.length === 0}
          <div class="text-center py-10 bg-gray-50 rounded-md">
            <p class="text-gray-500">Add cards to your deck to see statistics</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p class="text-sm text-gray-500 mb-1">Total Cards</p>
              <p class="text-3xl font-bold">{deckSize}</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p class="text-sm text-gray-500 mb-1">Unique Cards</p>
              <p class="text-3xl font-bold">{deck.length}</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p class="text-sm text-gray-500 mb-1">Average Mana Value</p>
              <p class="text-3xl font-bold">{avgCmc.toFixed(2)}</p>
            </div>
          </div>
          
          <h3 class="text-lg font-medium mb-3">Card Type Distribution</h3>
          <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-8">
            <div class="space-y-3">
              {#each Object.entries(typeCount) as [type, count]}
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium">{type}</span>
                    <span class="text-sm text-gray-500">{count} ({Math.round(count / deckSize * 100)}%)</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full" style="width: {(count / deckSize * 100)}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Export Tab -->
    {#if currentTab === 'export'}
      <div class="p-6">
        <h2 class="text-xl font-bold mb-4">Export Deck</h2>
        
        {#if deck.length === 0}
          <div class="text-center py-10 bg-gray-50 rounded-md">
            <p class="text-gray-500">Add cards to your deck to export</p>
          </div>
        {:else}
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Deck List Format</label>
            <textarea
              readonly
              class="w-full h-64 font-mono text-sm p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={deck.map(card => `${card.quantity || 1} ${card.name}`).join('\n')}
            ></textarea>
          </div>
          
          <div class="flex space-x-2">
            <button class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Copy to Clipboard
            </button>
            <button class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Download as TXT
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
