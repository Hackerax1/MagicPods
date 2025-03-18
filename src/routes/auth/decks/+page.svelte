<script context="module" lang="ts">
  import { getDecks } from '$lib/client/api'; // Ensure this is a client-side import

  export async function load() {
    const decks = await getDecks();
    return { props: { decks } };
  }
</script>

<script lang="ts">
  export let decks;
  import { onMount } from 'svelte';
  import DeckList from '$lib/components/DeckList.svelte';
  import DeckBuilder from '$lib/components/DeckBuilder.svelte';
  import DeckStats from '$lib/components/DeckStats.svelte';
  import DeckExport from '$lib/components/DeckExport.svelte';
  import DeckTabs from '$lib/components/DeckTabs.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  // Remove static import of CardScanner
  // import CardScanner from '$lib/components/CardScanner.svelte';
  import { user } from '$lib/stores/userStore';
  import { onDestroy } from 'svelte';
  
  // Track whether the scanner is needed
  let showScanner = false;
  let CardScannerComponent: any;
  
  // Dynamically import CardScanner only when needed
  function loadCardScanner() {
    if (!showScanner) {
      showScanner = true;
      import('$lib/components/CardScanner.svelte').then(module => {
        CardScannerComponent = module.default;
      });
    } else {
      showScanner = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Deck Builder</h1>
    <Button on:click={loadCardScanner} variant="primary">
      {showScanner ? 'Hide Scanner' : 'Show Card Scanner'}
    </Button>
  </div>
  
  {#if showScanner}
    <div class="mb-8">
      {#if CardScannerComponent}
        <svelte:component this={CardScannerComponent} />
      {:else}
        <div class="p-4 text-center">
          <div class="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p class="mt-2 text-gray-600">Loading scanner...</p>
        </div>
      {/if}
    </div>
  {/if}
  
  <div class="decks-container">
    <h1>Your Decks</h1>
    {#if decks.length > 0}
      <ul>
        {#each decks as deck}
          <li>
            <a href={`/auth/decks/${deck.id}`}>{deck.name}</a>
          </li>
        {/each}
      </ul>
    {:else}
      <p>No decks found. Create one to get started!</p>
    {/if}
  </div>
</div>

<style>
  .decks-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin-bottom: 10px;
  }
  a {
    text-decoration: none;
    color: #007bff;
  }
  a:hover {
    text-decoration: underline;
  }
</style>