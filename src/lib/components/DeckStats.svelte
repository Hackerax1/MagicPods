<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';

  interface DeckCard {
    id?: string;
    name: string;
    type_line: string;
    cmc?: number;
    quantity?: number;
  }

  export let deck: DeckCard[] = [];

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

  function countByType(cards: DeckCard[]) {
    return cards.reduce((acc, card) => {
      const type = getMainType(card.type_line);
      if (!acc[type]) acc[type] = 0;
      acc[type] += card.quantity || 1;
      return acc;
    }, {} as Record<string, number>);
  }

  function calculateAvgCmc(cards: DeckCard[]) {
    if (cards.length === 0) return 0;
    const totalCmc = cards.reduce((acc, card) => 
      acc + ((card.cmc || 0) * (card.quantity || 1)), 0);
    const totalCards = cards.reduce((acc, card) => 
      acc + (card.quantity || 1), 0);
    return totalCmc / totalCards;
  }
</script>

<div class="w-full max-w-7xl mx-auto p-4 sm:p-6">
  <Card title="Deck Statistics" elevation="raised" padding="default">  
    {#if deck.length === 0}
      <div class="text-center py-10 bg-gray-50 rounded-md">
        <p class="text-gray-500">Add cards to your deck to see statistics</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card elevation="flat" padding="default">
          <p class="text-sm text-gray-500 mb-1">Total Cards</p>
          <p class="text-3xl font-bold">{deckSize}</p>
        </Card>
        <Card elevation="flat" padding="default">
          <p class="text-sm text-gray-500 mb-1">Unique Cards</p>
          <p class="text-3xl font-bold">{uniqueCards}</p>
        </Card>
        <Card elevation="flat" padding="default">
          <p class="text-sm text-gray-500 mb-1">Average Mana Value</p>
          <p class="text-3xl font-bold">{avgCmc.toFixed(2)}</p>
        </Card>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card elevation="flat" padding="default" title="Card Type Distribution">
          <div class="space-y-3">
            {#each Object.entries(typeCount) as [type, count]}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center">
                    <Badge variant="primary" size="md" rounded={false}>{type}</Badge>
                  </div>
                  <span class="text-sm text-gray-500">{count} ({Math.round(count / deckSize * 100)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: {(count / deckSize * 100)}%"></div>
                </div>
              </div>
            {/each}
          </div>
        </Card>

        <!-- Reserved space for future statistics or charts -->
        <div class="hidden lg:block">
        </div>
      </div>
    {/if}
  </Card>
</div>