<script lang='ts'>
  import { onMount } from 'svelte';
  import { fetchCard, uploadCSV, addCardToCollection } from '$lib/utils/api';

  interface Card {
    name: string;
    image_uris?: { small: string };
  }

  let cardName = '';
  let csvFile: File | null = null;
  let collection: Card[] = [];

  async function addCard() {
    if (cardName) {
      const card: Card = await fetchCard(cardName);
      await addCardToCollection(card);
      collection.push(card);
      cardName = '';
    }
  }

  async function handleCSVUpload() {
    if (csvFile) {
      const cards: Card[] = await uploadCSV(csvFile);
      for (const card of cards) {
        await addCardToCollection(card);
      }
      collection = collection.concat(cards);
      csvFile = null;
    }
  }
</script>

<div class="collection-container">
  <h1>Your Collection</h1>

  <div class="add-card-form">
    <input type="text" bind:value={cardName} placeholder="Enter card name" />
    <button on:click={addCard}>Add Card</button>
  </div>

  <div class="upload-csv-form">
    <input type="file" accept=".csv" on:change={e => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        csvFile = target.files[0];
      }
    }} />
    <button on:click={handleCSVUpload}>Upload CSV</button>
  </div>

  <div class="collection-list">
    {#each collection as card}
      <div class="card-item">
        <img src={card.image_uris?.small} alt={card.name} />
        <span>{card.name}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .collection-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .collection-container h1 {
    text-align: center;
    margin-bottom: 24px;
    font-size: 28px;
    color: #333;
  }

  .add-card-form, .upload-csv-form {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }

  .collection-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .card-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .card-item img {
    max-width: 100%;
    border-radius: 4px;
    margin-bottom: 8px;
  }
</style>