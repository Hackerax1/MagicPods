<script lang="ts">
  interface Card {
    id?: string;
    name: string;
    type_line: string;
    cmc?: number;
    quantity?: number;
  }

  export let deck: Card[] = [];

  $: deckSize = deck.reduce((acc, card) => acc + (card.quantity || 1), 0);
  $: uniqueCards = deck.length;
  $: avgCmc = calculateAvgCmc(deck);
  $: typeCount = countByType(deck);

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
</script>

<div class="w-full max-w-7xl mx-auto p-4 sm:p-6">
  <h2 class="text-xl font-bold mb-6">Deck Statistics</h2>
  
  {#if deck.length === 0}
    <div class="text-center py-10 bg-gray-50 rounded-md">
      <p class="text-gray-500">Add cards to your deck to see statistics</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">Total Cards</p>
        <p class="text-3xl font-bold">{deckSize}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">Unique Cards</p>
        <p class="text-3xl font-bold">{uniqueCards}</p>
      </div>
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <p class="text-sm text-gray-500 mb-1">Average Mana Value</p>
        <p class="text-3xl font-bold">{avgCmc.toFixed(2)}</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 class="text-lg font-medium mb-3">Card Type Distribution</h3>
        <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div class="space-y-3">
            {#each Object.entries(typeCount) as [type, count]}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium">{type}</span>
                  <span class="text-sm text-gray-500">{count} ({Math.round(count / deckSize * 100)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: {(count / deckSize * 100)}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Reserved space for future statistics or charts -->
      <div class="hidden lg:block">
      </div>
    </div>
  {/if}
</div>