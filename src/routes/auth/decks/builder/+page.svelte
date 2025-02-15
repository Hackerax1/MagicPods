<script lang="ts">
  import DeckBuilder from '$lib/components/DeckBuilder.svelte';
  import Card from '$lib/components/Card.svelte';
</script>

<main>
  <h1>Deck Builder</h1>
  <Card />
  <DeckBuilder />
</main>

<style>
  main {
    padding: 16px;
  }
</style>
