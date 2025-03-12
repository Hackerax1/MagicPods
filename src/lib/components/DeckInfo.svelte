<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  
  export let deckName = 'Untitled Deck';
  export let deckDescription = '';
  export let savingDeck = false;
  export let error = '';
  export let onSave: () => Promise<void>;

  const handleSave = async () => {
    if (deckName.trim() === '') {
      error = 'Please enter a deck name';
      return;
    }
    await onSave();
  };
</script>

<Card elevation="flat" padding="default" title="Deck Information">  
  <div class="space-y-4">
    <Input 
      id="deck-name"
      label="Deck Name"
      bind:value={deckName} 
      placeholder="Enter deck name"
      error={error && deckName.trim() === '' ? error : ''}
      required={true}
    />
    
    <div>
      <label for="deck-description" class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
      <textarea 
        id="deck-description"
        bind:value={deckDescription} 
        rows="3"
        placeholder="Enter deck description" 
        class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      ></textarea>
    </div>
    
    {#if error && deckName.trim() !== ''}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    
    <Button 
      on:click={handleSave}
      variant="success"
      fullWidth={true}
      loading={savingDeck}
      disabled={savingDeck}
    >
      Save Deck
    </Button>
  </div>
</Card>