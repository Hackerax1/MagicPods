<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import CardImage from '$lib/components/ui/CardImage.svelte';
  
  const dispatch = createEventDispatcher();

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

  export let sortOption = 'type'; // 'type', 'cmc', 'name'
  
  // Touch interaction state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchThreshold = 50; // Minimum swipe distance
  let activeCardId: string | null = null;
  
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
    if (sortOption === 'type') {
      return groupByType(deck);
    } else if (sortOption === 'cmc') {
      return groupByCmc(deck);
    } else {
      return groupByName(deck);
    }
  };

  $: deckSize = deck.reduce((acc, card) => acc + (card.quantity || 1), 0);

  let dragSource: Card | null = null;
  let dragTarget: Card | null = null;

  function handleDragStart(event: DragEvent, card: Card) {
    if (!event.dataTransfer) return;
    dragSource = card;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', card.name);
  }

  function handleDragOver(event: DragEvent, card: Card) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    event.dataTransfer.dropEffect = 'move';
    dragTarget = card;
  }

  function handleDrop(event: DragEvent, targetCard: Card) {
    event.preventDefault();
    if (!dragSource || dragSource === targetCard) return;

    const sourceIndex = deck.findIndex(card => card === dragSource);
    const targetIndex = deck.findIndex(card => card === targetCard);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newDeck = [...deck];
      const [removed] = newDeck.splice(sourceIndex, 1);
      newDeck.splice(targetIndex, 0, removed);
      deck = newDeck;
    }
    
    dragSource = null;
    dragTarget = null;
  }

  function handleKeyDown(event: KeyboardEvent, card: Card) {
    dispatch('keydown', { event, card });
  }

  function handleDragEnd() {
    dragSource = null;
    dragTarget = null;
  }
  
  // Touch event handlers for mobile
  function handleTouchStart(event: TouchEvent, card: Card) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      if (card.id) {
        activeCardId = card.id;
      }
    }
  }
  
  function handleTouchMove(event: TouchEvent) {
    // Prevent scrolling while swiping
    if (activeCardId) {
      event.preventDefault();
    }
  }
  
  function handleTouchEnd(event: TouchEvent, card: Card) {
    if (activeCardId !== (card.id || null)) return;
    
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      // If horizontal swipe is greater than vertical and exceeds threshold
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchThreshold) {
        if (deltaX > 0) {
          // Swipe right - add card
          onAddCard(card);
        } else {
          // Swipe left - remove card
          onRemoveCard(card);
        }
      }
    }
    
    activeCardId = null;
  }
  
  onMount(() => {
    // Add passive touch event listeners
    const cardElements = document.querySelectorAll('[data-card-id]');
    cardElements.forEach(element => {
      element.addEventListener('touchmove', ((e: Event) => {
        handleTouchMove(e as TouchEvent);
      }) as EventListener, { passive: false });
    });
    
    return () => {
      // Clean up listeners
      cardElements.forEach(element => {
        element.removeEventListener('touchmove', ((e: Event) => {
          handleTouchMove(e as TouchEvent);
        }) as EventListener);
      });
    };
  });
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
    <div class="text-center py-10 bg-gray-50 rounded-md">
      <p class="text-gray-500">Add cards to your deck to see them here</p>
    </div>
  {:else}
    <div class="grid gap-4">
      {#each Object.entries(sortedDeck()) as [category, cards]}
        <div class="card-group">
          <h3 class="text-lg font-medium text-gray-900 mb-2">{category} ({cards.length})</h3>
          <ul class="space-y-2" role="list">
            {#each cards as card}
              <li 
                class="group block w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative {activeCardId === card.id ? 'active-card' : ''}"
                role="listitem"
                data-card-id={card.id}
              >
                <div
                  class="w-full flex items-center p-2"
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(e, card)}
                  on:dragover={(e) => handleDragOver(e, card)}
                  on:drop={(e) => handleDrop(e, card)}
                  on:dragend={handleDragEnd}
                  on:keydown={(e) => handleKeyDown(e, card)}
                  on:touchstart={(e) => handleTouchStart(e, card)}
                  on:touchend={(e) => handleTouchEnd(e, card)}
                  tabindex="0"
                  role="button"
                  aria-label="{card.name}, {card.type_line}, Quantity: {card.quantity || 1}"
                  aria-roledescription="draggable card item"
                  aria-grabbed={dragSource === card}
                >
                  <div class="flex-shrink-0 mr-3 w-16 h-16 relative">
                    {#if card.image_uris}
                      <CardImage 
                        cardId={card.id}
                        imageUrl={card.image_uris.art_crop}
                        altText={card.name}
                        loading="lazy"
                        artOnly={true}
                        fetchPriority="low"
                        sizes="(max-width: 640px) 64px, 80px"
                      />
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0 pr-2">
                    <p class="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                    <p class="text-xs text-gray-500 truncate">{card.type_line}</p>
                    <p class="text-xs text-indigo-600 md:hidden">Swipe left to remove, right to add</p>
                  </div>
                  <div 
                    class="flex items-center gap-1 ml-auto"
                    role="group"
                    aria-label="Card quantity controls"
                  >
                    <button 
                      on:click={() => onRemoveCard(card)}
                      type="button"
                      class="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 touch-action-manipulation"
                      aria-label="Remove one {card.name}"
                    >
                      <svg class="h-6 w-6 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <span 
                      class="text-sm font-medium min-w-[1.5rem] text-center"
                      aria-label="Quantity"
                    >
                      {card.quantity || 1}
                    </span>
                    <button 
                      on:click={() => onAddCard(card)}
                      type="button"
                      class="p-1 rounded-full text-gray-400 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 touch-action-manipulation"
                      aria-label="Add one more {card.name}"
                    >
                      <svg class="h-6 w-6 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {/if}
  
  <div class="mt-8 p-4 bg-indigo-50 rounded-md border border-indigo-200 md:hidden">
    <h3 class="text-sm font-medium text-indigo-700 mb-2">Mobile Controls</h3>
    <ul class="text-xs text-indigo-600 space-y-1">
      <li>• Swipe left on a card to remove one</li>
      <li>• Swipe right on a card to add one</li>
      <li>• Tap the + and - buttons to adjust quantity</li>
    </ul>
  </div>
</div>

<style>
  [draggable="true"] {
    cursor: grab;
  }

  [draggable="true"]:active {
    cursor: grabbing;
  }

  [draggable="true"]:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  .active-card {
    background-color: #f9fafb;
  }
  
  .touch-action-manipulation {
    touch-action: manipulation;
  }

  @media (prefers-reduced-motion: reduce) {
    .transition-shadow {
      transition: none;
    }
  }
  
  @media (max-width: 640px) {
    button {
      min-height: 44px;
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
</style>
