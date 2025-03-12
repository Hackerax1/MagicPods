<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';

  interface Card {
    id?: string;
    name: string;
    quantity?: number;
  }

  export let deck: Card[] = [];
  let showCopyAlert = false;

  $: deckList = deck.map(card => `${card.quantity || 1} ${card.name}`).join('\n');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deckList);
      showCopyAlert = true;
      setTimeout(() => showCopyAlert = false, 3000);
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
  <Card title="Export Deck" elevation="raised" padding="default">
    {#if showCopyAlert}
      <div class="mb-4">
        <Alert type="success" dismissable={true} on:close={() => showCopyAlert = false}>
          Deck list copied to clipboard!
        </Alert>
      </div>
    {/if}
  
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
        <Button 
          on:click={copyToClipboard}
          variant="primary"
          fullWidth={true}
        >
          Copy to Clipboard
        </Button>
        <Button 
          on:click={downloadTxt}
          variant="outline"
          fullWidth={true}
        >
          Download as TXT
        </Button>
      </div>
    {/if}
  </Card>
</div>