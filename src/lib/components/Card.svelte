<script lang="ts">
  import { fetchCard } from '$lib/utils/scryfall';

  interface Card {
    name: string;
    image_uris: {
      normal: string;
    };
    oracle_text: string;
  }
  let cardName = '';
  let cardData: Card | null = null;

  const searchCard = async () => {
    try {
      cardData = await fetchCard(cardName);
    } catch (error) {
      console.error('Error fetching card:', error);
    }
  };
</script>

<input type="text" bind:value={cardName} placeholder="Enter card name" />
<button on:click={searchCard}>Search</button>

{#if cardData}
  <div>
    <h2>{cardData.name}</h2>
    <img src={cardData.image_uris.normal} alt={cardData.name} />
    <p>{cardData.oracle_text}</p>
  </div>
{/if}
