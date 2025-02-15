<script context="module" lang="ts">
  import { getDecks } from '../../../lib/api/decks'; // Ensure this is a client-side import

  export async function load() {
    const decks = await getDecks();
    return { props: { decks } };
  }
</script>

<script lang="ts">
  export let decks;
</script>

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