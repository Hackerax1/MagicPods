<script lang="ts">
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

  export let deck: Card[] = [];
  export let onRemoveCard: (card: Card) => void;
  export let onAddCard: (card: Card) => void;
  export let isDragging = false;

  export let sortOption = 'type'; // 'type', 'cmc', 'name'
  
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

  $: sortedDeck = () => {
    // Ensure all cards have IDs for drag and drop
    const cardsWithIds = deck.map(card => {
      if (!card.id) {
        return { ...card, id: crypto.randomUUID() };
      }
      return card;
    });
    
    if (sortOption === 'type') {
      return groupByType(cardsWithIds);
    } else if (sortOption === 'cmc') {
      return groupByCmc(cardsWithIds);
    } else {
      return groupByName(cardsWithIds);
    }
  };

  $: deckSize = deck.reduce((acc, card) => acc + (card.quantity || 1), 0);
  
  // Handle drag and drop events
  function handleDndConsider(e: CustomEvent<any>) {
    // Forward the event to parent
    dispatch('consider', e.detail);
  }
  
  function handleDndFinalize(e: CustomEvent<any>) {
    // Forward the event to parent
    dispatch('finalize', e.detail);
  }
  
  // Create dispatch function for events
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bg-gray-50 p-4 rounded-md w-full">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
    <h2 class="text-lg font-medium text-gray-900">Current Deck ({deckSize} cards)</h2>
    
    <div class="flex items-center gap-2 w-full sm:w-auto">
      <label for="sort-option" class="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
      <select 
        id="sort-option" 
        bind:value={sortOption}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-w-[120px]"
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
      <p class="text-sm text-gray-500 mt-2">You can also drag cards from search results</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each Object.entries(sortedDeck()) as [category, cards]}
        <div>
          <h3 class="font-medium text-gray-900 mb-2 flex flex-wrap items-center gap-2">
            <span>{category}</span>
            <span class="text-sm text-gray-500">({cards.length} {cards.length === 1 ? 'card' : 'cards'})</span>
          </h3>
          
          <section
            use:dndzone={{items: cards, type: 'deck-cards', dropTargetStyle: {outline: isDragging ? '2px dashed #6366F1' : 'none'}}}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {#each cards as card (card.id)}
              <div animate:flip={{duration: 200}} class="card-item">
                <div class="flex items-center bg-white p-2 rounded-md border border-gray-200 hover:border-indigo-300 transition-colors cursor-move">
                  <div class="flex-shrink-0 mr-3 w-16">
                    {#if card.image_uris?.art_crop}
                      <img 
                        src={getCardImageUrls(card.image_uris.art_crop).art_crop} 
                        alt={card.name} 
                        class="w-full h-12 object-cover rounded shadow-sm"
                        loading="lazy"
                        fetchpriority="low"
                      />
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0 pr-2">
                    <p class="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                    <p class="text-xs text-gray-500 truncate">{card.type_line}</p>
                  </div>
                  <div class="flex items-center gap-1 ml-auto">
                    <button 
                      on:click={() => onRemoveCard(card)}
                      class="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                      title="Remove one"
                      aria-label="Remove one card"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <span class="text-sm font-medium min-w-[1.5rem] text-center">{card.quantity || 1}</span>
                    <button 
                      on:click={() => onAddCard(card)}
                      class="p-1 rounded-full text-gray-400 hover:text-green-500 focus:outline-none"
                      title="Add one more"
                      aria-label="Add one more card"
                    >
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </section>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card-item {
    touch-action: none;
  }
</style>