<script lang="ts">
  import CardSearch from './CardSearch.svelte';
  import DeckInfo from './DeckInfo.svelte';
  import DeckList from './DeckList.svelte';
  import DeckStats from './DeckStats.svelte';
  import DeckExport from './DeckExport.svelte';
  import DeckTabs from './DeckTabs.svelte';

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

  const handleCardFound = (card: Card) => {
    const existingCardIndex = deck.findIndex(c => c.name === card.name);
      
    if (existingCardIndex >= 0) {
      const newDeck = [...deck];
      newDeck[existingCardIndex].quantity = (newDeck[existingCardIndex].quantity || 1) + 1;
      deck = newDeck;
    } else {
      deck = [...deck, { ...card, quantity: 1 }];
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
</script>

<div class="deck-builder-container">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="bg-indigo-700 text-white p-4">
      <h1 class="text-2xl font-bold">Deck Builder</h1>
    </div>
    
    <DeckTabs bind:currentTab />
    
    {#if currentTab === 'builder'}
      <div class="p-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column -->
          <div class="lg:col-span-1 space-y-6">
            <CardSearch onCardFound={handleCardFound} />
            <DeckInfo
              bind:deckName
              bind:deckDescription
              bind:savingDeck
              bind:error
              onSave={handleSaveDeck}
            />
          </div>
          
          <!-- Right Column -->
          <div class="lg:col-span-2">
            <DeckList
              {deck}
              bind:sortOption
              onRemoveCard={handleRemoveCard}
              onAddCard={handleAddCard}
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
