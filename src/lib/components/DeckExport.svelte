<script lang="ts">
  interface Card {
    id?: string;
    name: string;
    quantity?: number;
  }

  export let deck: Card[] = [];

  $: deckList = deck.map(card => `${card.quantity || 1} ${card.name}`).join('\n');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deckList);
      alert('Deck list copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy deck list');
    }
  };

  const downloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([deckList], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'deck.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
</script>

<div class="w-full max-w-7xl mx-auto p-4 sm:p-6">
  <h2 class="text-xl font-bold mb-6">Export Deck</h2>
  
  {#if deck.length === 0}
    <div class="text-center py-10 bg-gray-50 rounded-md">
      <p class="text-gray-500">Add cards to your deck to export</p>
    </div>
  {:else}
    <div class="mb-6">
      <label for="deck-list" class="block text-sm font-medium text-gray-700 mb-2">Deck List Format</label>
      <div class="relative">
        <textarea
          id="deck-list"
          readonly
          class="w-full h-[40vh] font-mono text-sm p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={deckList}
        ></textarea>
      </div>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-3">
      <button 
        on:click={copyToClipboard}
        class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Copy to Clipboard
      </button>
      <button 
        on:click={downloadTxt}
        class="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Download as TXT
      </button>
    </div>
  {/if}
</div>