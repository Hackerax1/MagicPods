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

<main class="container mx-auto px-4 py-6">
  <div class="grid gap-6">
    <!-- Pod list section -->
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Your Pods</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each pods as pod}
          <div class="bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{pod.name}</h3>
              <div class="mt-2 space-y-2">
                {#each podDecks[pod.id] || [] as deck}
                  <div class="flex items-center justify-between bg-white p-2 rounded">
                    <span class="text-sm text-gray-700">{deck.name}</span>
                    <button 
                      on:click={() => handleRemoveDeckFromPod(deck.id)}
                      class="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
              </div>
            </div>
            <button 
              on:click={() => handleRemoveFromPod(pod.id)}
              class="mt-4 w-full bg-red-100 text-red-700 py-2 px-4 rounded hover:bg-red-200 transition-colors"
            >
              Leave Pod
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Forms section -->
    <div class="grid gap-6 sm:grid-cols-2">
      <!-- Add user form -->
      <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add User to Pod</h3>
        <form on:submit|preventDefault={handleAddToPod} class="space-y-4">
          <div>
            <label for="newUser" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              id="newUser"
              bind:value={newUser} 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter username"
            />
          </div>
          <button 
            type="submit" 
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Add User
          </button>
        </form>
      </div>

      <!-- Add deck form -->
      <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add Deck to Pod</h3>
        <form on:submit|preventDefault={handleAddDeckToPod} class="space-y-4">
          <div>
            <label for="newDeck" class="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
            <input 
              type="text" 
              id="newDeck"
              bind:value={newDeck} 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter deck name"
            />
          </div>
          <button 
            type="submit" 
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Add Deck
          </button>
        </form>
      </div>
    </div>

    <!-- Win/Loss tracking section -->
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Update Win/Loss Record</h3>
      <form on:submit|preventDefault={handleUpdateWinLoss} class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label for="deckSelect" class="block text-sm font-medium text-gray-700 mb-1">Select Deck</label>
            <input 
              type="text" 
              id="deckSelect"
              bind:value={deckId} 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter deck ID"
            />
          </div>
          <div>
            <label for="wins" class="block text-sm font-medium text-gray-700 mb-1">Wins</label>
            <input 
              type="number" 
              id="wins"
              bind:value={win} 
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label for="losses" class="block text-sm font-medium text-gray-700 mb-1">Losses</label>
            <input 
              type="number" 
              id="losses"
              bind:value={loss} 
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button 
          type="submit" 
          class="w-full sm:w-auto bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 transition-colors"
        >
          Update Record
        </button>
      </form>
    </div>
  </div>
</main>

