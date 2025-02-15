<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserPods, getPodDecks, inviteUserToPod, createDeck, removeUserFromPod, removeDeckFromPod, updateWinLoss } from '$lib/server/db';

  let pods: Array<{ id: string; name: string }> = [];
  let podDecks: { [key: string]: Array<{ id: string; name: string }> } = {};
  let podWinLoss: { [key: string]: { win: number; loss: number } } = {};
  let newUser = '';
  let newDeck = '';
  let deckId = '';
  let win = 0;
  let loss = 0;
  let userId = 'currentUserId'; // Replace with actual user ID

  onMount(async () => {
    pods = await getUserPods(userId);
    for (let pod of pods) {
      podDecks[pod.id] = await getPodDecks(pod.id);
      podWinLoss[pod.id] = { win: 0, loss: 0 }; // Initialize win/loss
    }
  });

  const handleAddToPod = async () => {
    if (pods.some(p => p.id === newUser)) return;
    await inviteUserToPod(pods[0].id, newUser); // Assuming adding to the first pod
    newUser = '';
  };

  const handleRemoveFromPod = async (userId: string) => {
    await removeUserFromPod(pods[0].id, userId); // Assuming removing from the first pod
  };

  const handleAddDeckToPod = async () => {
    const deck = await createDeck(newDeck, userId);
    podDecks[pods[0].id].push(deck); // Assuming adding to the first pod
    newDeck = '';
  };

  const handleRemoveDeckFromPod = async (deckId: string) => {
    await removeDeckFromPod(deckId);
    podDecks[pods[0].id] = podDecks[pods[0].id].filter(deck => deck.id !== deckId); // Assuming removing from the first pod
  };

  const handleUpdateWinLoss = async () => {
    await updateWinLoss(deckId, win, loss);
    podWinLoss[deckId] = { win, loss };
    deckId = '';
    win = 0;
    loss = 0;
  };
</script>

<style>
  .pod {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 1rem;
  }

  .pod-user {
    margin: 0.5rem;
  }

  .pod-deck {
    margin: 0.5rem;
  }
</style>

<main>
  <div class="pod">
    {#each pods as pod}
      <div class="pod-user">
        {pod.name}
        <button on:click={() => handleRemoveFromPod(pod.id)}>Remove from Pod</button>
      </div>
    {/each}

    {#each pods as pod}
      {#each podDecks[pod.id] as deck}
        <div class="pod-deck">
          {deck.name}
          <button on:click={() => handleRemoveDeckFromPod(deck.id)}>Remove Deck from Pod</button>
        </div>
      {/each}
    {/each}
  </div>

  <form on:submit|preventDefault={handleAddToPod}>
    <input type="text" bind:value={newUser} placeholder="Enter user name to add to pod" />
    <button type="submit">Add to Pod</button>
  </form>

  <form on:submit|preventDefault={handleAddDeckToPod}>
    <input type="text" bind:value={newDeck} placeholder="Enter deck name to add to pod" />
    <button type="submit">Add Deck to Pod</button>
  </form>

  <form on:submit|preventDefault={handleUpdateWinLoss}>
    <input type="text" bind:value={deckId} placeholder="Enter deck ID to update win/loss" />
    <input type="number" bind:value={win} placeholder="Enter number of wins" />
    <input type="number" bind:value={loss} placeholder="Enter number of losses" />
    <button type="submit">Update Win/Loss</button>
  </form>
</main>