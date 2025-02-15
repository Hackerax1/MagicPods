<script lang="ts">
  import { fetchCard } from '$lib/server/scryfall';

  interface Card {
    name: string;
    type_line: string;
    image_uris: {
      normal: string;
    };
  }

  let cardName = '';
  let cardData: Card | null = null;
  let deck: Card[] = [];

  const handleSearch = async () => {
    cardData = await fetchCard(cardName);
  };

  const handleAddToDeck = () => {
    if (cardData) {
      deck.push(cardData);
      cardData = null;
    }
  };

  const handleRemoveFromDeck = (card: Card) => {
    deck = deck.filter((c) => c !== card);
  };

  const groupedDeck = () => {
    return deck.reduce((acc, card) => {
      const type = card.type_line.split(' — ')[0];
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(card);
      return acc;
    }, {} as Record<string, Card[]>);
  };
</script>

<main>
  <h1>Deck Builder</h1>
  <input type="text" bind:value={cardName} placeholder="Enter card name" />
  <button on:click={handleSearch}>Search</button>
  {#if cardData}
    <div>
      <h2>{cardData.name}</h2>
      <img src={cardData.image_uris.normal} alt={cardData.name} />
      <button on:click={handleAddToDeck}>Add to Deck</button>
    </div>
  {/if}
  <h2>Deck</h2>
  {#each Object.entries(groupedDeck()) as [type, cards]}
    <h3>{type}</h3>
    <ul>
      {#each cards as card}
        <li>
          <h4>{card.name}</h4>
          <img src={card.image_uris.normal} alt={card.name} />
          <button on:click={() => handleRemoveFromDeck(card)}>Remove</button>
        </li>
      {/each}
    </ul>
  {/each}
</main>
