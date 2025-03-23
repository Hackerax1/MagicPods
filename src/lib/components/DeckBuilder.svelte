<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import CardSearch from './CardSearch.svelte';
  import DeckInfo from './DeckInfo.svelte';
  import DeckList from './DeckList.svelte';
  // Import components lazily when needed
  import LazyLoad from '$lib/components/ui/LazyLoad.svelte';
  
  // Import UI components
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import KeyboardShortcuts from '$lib/components/ui/KeyboardShortcuts.svelte';

  // Import keyboard utilities
  import { keyboardManager } from '$lib/utils/keyboard';

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
  let showKeyboardShortcuts = false;

  // Lazy loading state
  let statsComponentLoaded = false;
  let exportComponentLoaded = false;
  let DeckStatsComponent: any;
  let DeckExportComponent: any;
  let DeckTabsComponent: any;

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

  function handleCardKeyDown(event: KeyboardEvent, card: Card) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      // Toggle card details or perform primary action
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const cards = deck.flatMap(c => c);
      const currentIndex = cards.indexOf(card);
      const newIndex = event.key === 'ArrowUp' 
        ? (currentIndex - 1 + cards.length) % cards.length
        : (currentIndex + 1) % cards.length;
      
      // Focus the new card
      const cardElements = document.querySelectorAll('[data-card-id]');
      (cardElements[newIndex] as HTMLElement)?.focus();
    } else if (event.key === '+') {
      event.preventDefault();
      handleAddCard(card);
    } else if (event.key === '-') {
      event.preventDefault();
      handleRemoveCard(card);
    }
  }

  function toggleKeyboardShortcutsHelp() {
    showKeyboardShortcuts = !showKeyboardShortcuts;
  }

  function switchTab(tabName: string) {
    currentTab = tabName;
    
    // Preload components for selected tab
    if (tabName === 'stats' && !statsComponentLoaded) {
      import('./DeckStats.svelte').then(module => {
        DeckStatsComponent = module.default;
        statsComponentLoaded = true;
      });
    } else if (tabName === 'export' && !exportComponentLoaded) {
      import('./DeckExport.svelte').then(module => {
        DeckExportComponent = module.default;
        exportComponentLoaded = true;
      });
    }
  }

  onMount(() => {
    // Preload DeckTabs component
    import('./DeckTabs.svelte').then(module => {
      DeckTabsComponent = module.default;
    });
    
    // Register application-wide shortcuts
    keyboardManager.register({
      key: '?',
      description: 'Show keyboard shortcuts help',
      handler: () => toggleKeyboardShortcutsHelp()
    });
    
    keyboardManager.register({
      key: 's',
      ctrl: true,
      description: 'Save deck',
      handler: (e) => {
        e.preventDefault();
        handleSaveDeck();
      }
    });
    
    keyboardManager.register({
      key: 'b',
      ctrl: true,
      description: 'Switch to builder tab',
      handler: () => switchTab('builder')
    });
    
    keyboardManager.register({
      key: 't',
      ctrl: true,
      description: 'Switch to stats tab',
      handler: () => switchTab('stats')
    });
    
    keyboardManager.register({
      key: 'e',
      ctrl: true,
      description: 'Switch to export tab',
      handler: () => switchTab('export')
    });

    keyboardManager.register({
      key: 'f',
      ctrl: true,
      description: 'Focus card search',
      handler: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLElement;
        searchInput?.focus();
      }
    });

    keyboardManager.register({
      key: 'Escape',
      description: 'Close any open dialog or reset focus',
      handler: () => {
        if (showKeyboardShortcuts) {
          showKeyboardShortcuts = false;
        } else if (showAlert) {
          showAlert = false;
        }
        // Could add more handlers here for other modals or dialogs
      }
    });
    
    // Preload the stats component after a delay
    setTimeout(() => {
      if (!statsComponentLoaded) {
        import('./DeckStats.svelte').then(module => {
          DeckStatsComponent = module.default;
          statsComponentLoaded = true;
        });
      }
    }, 3000);
  });

  onDestroy(() => {
    // Clean up shortcuts when component is destroyed
    keyboardManager.unregister('?');
    keyboardManager.unregister('s', { ctrl: true });
    keyboardManager.unregister('b', { ctrl: true });
    keyboardManager.unregister('t', { ctrl: true });
    keyboardManager.unregister('e', { ctrl: true });
    keyboardManager.unregister('f', { ctrl: true });
    keyboardManager.unregister('Escape');
  });
</script>

<div class="min-h-screen max-w-[1920px] mx-auto p-4">
  <Card elevation="elevated" padding="none">
    <div class="bg-indigo-700 text-white p-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold">Deck Builder</h1>
      <Button 
        variant="secondary" 
        on:click={toggleKeyboardShortcutsHelp}
        aria-label="Show keyboard shortcuts"
      >
        <span class="hidden sm:inline mr-2">Shortcuts</span>
        <span class="inline-block text-sm border rounded px-1">?</span>
      </Button>
    </div>
    
    {#if DeckTabsComponent}
      <svelte:component this={DeckTabsComponent} bind:currentTab />
    {:else}
      <!-- Placeholder while loading -->
      <div class="flex flex-wrap sm:flex-nowrap border-b border-gray-200">
        {#each [{ id: 'builder', label: 'Builder' }, { id: 'stats', label: 'Statistics' }, { id: 'export', label: 'Export' }] as tab}
          <button 
            class={`flex-1 min-w-[100px] px-4 py-2 font-medium text-sm ${currentTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500 hover:border-b-2 hover:border-indigo-300'} transition-colors`} 
            on:click={() => switchTab(tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>
    {/if}

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
              <CardSearch 
                onCardFound={handleCardFound}
              />
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
          <div 
            class="xl:col-span-2 2xl:col-span-3"
            role="region"
            aria-label="Deck contents"
          >
            <DeckList
              {deck}
              bind:sortOption
              onRemoveCard={handleRemoveCard}
              onAddCard={handleAddCard}
              on:keydown={(event) => {
                handleCardKeyDown(event.detail.event, event.detail.card);
              }}
            />
            <div class="sr-only" aria-live="polite">
              <p>Use arrow keys to navigate between cards</p>
              <p>Use plus and minus keys to adjust card quantities</p>
              <p>Press Enter or Space to view card details</p>
              <p>Press question mark to view all keyboard shortcuts</p>
            </div>
          </div>
        </div>
      </div>
    {:else if currentTab === 'stats'}
      <LazyLoad>
        {#if statsComponentLoaded && DeckStatsComponent}
          <svelte:component this={DeckStatsComponent} {deck} />
        {:else}
          <div class="p-4 text-center">
            <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" role="status">
              <span class="sr-only">Loading statistics...</span>
            </div>
            <p class="mt-2 text-gray-600">Loading deck statistics...</p>
          </div>
        {/if}
      </LazyLoad>
    {:else if currentTab === 'export'}
      <LazyLoad>
        {#if exportComponentLoaded && DeckExportComponent}
          <svelte:component this={DeckExportComponent} {deck} />
        {:else}
          <div class="p-4 text-center">
            <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" role="status">
              <span class="sr-only">Loading export options...</span>
            </div>
            <p class="mt-2 text-gray-600">Loading export options...</p>
          </div>
        {/if}
      </LazyLoad>
    {/if}
  </Card>
</div>

<div 
  class="fixed inset-x-0 bottom-4 flex justify-center"
  aria-live="polite"
>
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
      {error}
    </div>
  {/if}
</div>

<KeyboardShortcuts 
  showHelp={showKeyboardShortcuts} 
  on:close={() => showKeyboardShortcuts = false} 
/>
