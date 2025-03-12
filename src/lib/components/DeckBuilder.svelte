<script lang="ts">
  import CardSearch from './CardSearch.svelte';
  import DeckInfo from './DeckInfo.svelte';
  import DeckList from './DeckList.svelte';
  import DeckStats from './DeckStats.svelte';
  import DeckExport from './DeckExport.svelte';
  import DeckTabs from './DeckTabs.svelte';
  
  // Import UI components
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';

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
  let showAlert = false;
  let alertType: 'success' | 'error' = 'success';
  let alertMessage = '';

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
      showAlert = true;
      alertType = 'error';
      alertMessage = 'Please enter a deck name';
      return;
    }
    
    savingDeck = true;
    
    try {
      // Simulate API call to save deck
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saved deck:', { name: deckName, description: deckDescription, cards: deck });
      
      savingDeck = false;
      error = '';
      showAlert = true;
      alertType = 'success';
      alertMessage = 'Deck saved successfully!';
    } catch (err) {
      console.error('Error saving deck:', err);
      error = 'Failed to save deck. Please try again.';
      showAlert = true;
      alertType = 'error';
      alertMessage = 'Failed to save deck. Please try again.';
      savingDeck = false;
    }
  };

  const closeAlert = () => {
    showAlert = false;
  };
</script>

<div class="min-h-screen max-w-[1920px] mx-auto p-4">
  <Card elevation="elevated" padding="none">
    <div class="bg-indigo-700 text-white p-4">
      <h1 class="text-2xl font-bold">Deck Builder</h1>
    </div>
    
    <DeckTabs bind:currentTab />

    {#if showAlert}
      <div class="p-4">
        <Alert type={alertType} dismissable={true} on:close={closeAlert}>
          {alertMessage}
        </Alert>
      </div>
    {/if}
    
    {#if currentTab === 'builder'}
      <div class="p-4">
        <div class="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <!-- Left Column -->
          <div class="xl:col-span-1">
            <div class="sticky top-4 space-y-6">
              <CardSearch onCardFound={handleCardFound} />
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
            />
          </div>
        </div>
      </div>
    {:else if currentTab === 'stats'}
      <DeckStats {deck} />
    {:else if currentTab === 'export'}
      <DeckExport {deck} />
    {/if}
  </Card>
</div>
