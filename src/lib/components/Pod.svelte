<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { createDeck, removeDeckFromPod, updateWinLoss } from '$lib/server/db';
  import { user } from '$lib/stores/userStore';
  import { fetchUserPods, fetchPodMembers, addUserToPod, removeUserFromPod as apiRemoveUserFromPod, updatePodName } from '$lib/client/api';
  import { tradeStore } from '../stores/tradeStore';
  import TradeNotifications from './TradeNotifications.svelte';
  
  // Import UI components
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';

  let pods: Array<{ id: string; name: string }> = [];
  let podDecks: { [key: string]: Array<{ id: string; name: string }> } = {};
  let podWinLoss: { [key: string]: { win: number; loss: number } } = {};
  let newUser = '';
  let newDeck = '';
  let deckId = '';
  let win = 0;
  let loss = 0;
  let currentUser: any;

  let selectedCards: any[] = [];
  let participants: any[] = [];
  let loadingParticipants = true;
  let selectedParticipants: string[] = [];
  let error = '';

  user.subscribe(value => { currentUser = value; });

  onMount(async () => {
    if (!currentUser?.id) return;
    pods = await fetchUserPods(currentUser.id);
    for (let pod of pods) {
      podDecks[pod.id] = await fetchPodDecks ? await fetchPodDecks(pod.id) : [];
      podWinLoss[pod.id] = { win: 0, loss: 0 }; // Initialize win/loss
    }
    await loadPodParticipants();
  });

  const handleAddToPod = async () => {
    if (!newUser.trim()) {
      error = "Please enter a username";
      return;
    }
    if (pods.some(p => p.id === newUser)) return;
    
    try {
      await addUserToPod(pods[0].id, newUser);
      newUser = '';
      error = '';
      await loadPodParticipants();
    } catch (err) {
      error = "Failed to add user to pod";
      console.error(err);
    }
  };

  const handleRemoveFromPod = async (userId: string) => {
    await apiRemoveUserFromPod(pods[0].id, userId);
    await loadPods();
  };

  const handleAddDeckToPod = async () => {
    if (!newDeck.trim()) {
      error = "Please enter a deck name";
      return;
    }
    
    try {
      const deck = await createDeck(newDeck, currentUser.id);
      podDecks[pods[0].id].push(deck); // Assuming adding to the first pod
      newDeck = '';
      error = '';
    } catch (err) {
      error = "Failed to create deck";
      console.error(err);
    }
  };

  const handleRemoveDeckFromPod = async (deckId: string) => {
    await removeDeckFromPod(deckId);
    podDecks[pods[0].id] = podDecks[pods[0].id].filter(deck => deck.id !== deckId); // Assuming removing from the first pod
  };

  const handleUpdateWinLoss = async () => {
    if (!deckId.trim()) {
      error = "Please select a deck";
      return;
    }
    
    try {
      await updateWinLoss(deckId, win, loss);
      podWinLoss[deckId] = { win, loss };
      error = '';
    } catch (err) {
      error = "Failed to update win/loss record";
      console.error(err);
    }
  };

  async function loadPodParticipants() {
    try {
      const data = await fetchPodMembers(pods[0]?.id);
      participants = data.members || data;
    } catch (error) {
      console.error('Failed to load pod participants:', error);
    } finally {
      loadingParticipants = false;
    }
  }

  async function createTrade() {
    if (!selectedCards.length || !selectedParticipants.length) {
      error = "Please select cards and participants";
      return;
    }
    
    try {
      const response = await fetch('/api/trades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          podId: pods[0].id,
          participants: selectedParticipants,
          items: selectedCards.map(card => ({
            userCardId: card.id,
            quantity: card.quantity
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        selectedCards = [];
        selectedParticipants = [];
        error = '';
        // Update trade store
        tradeStore.setTrades([data.trade, ...get(tradeStore).trades]);
      } else {
        error = data.error || "Failed to create trade";
      }
    } catch (err) {
      error = "Failed to create trade";
      console.error('Failed to create trade:', err);
    }
  }

  const handleRenamePod = async (podId: string, newName: string) => {
    try {
      await updatePodName(podId, newName);
      await loadPods();
    } catch (err) {
      console.error('Rename failed', err);
    }
  };
</script>

<main class="container mx-auto px-4 py-6">
  <div class="grid gap-6">
    {#if error}
      <Alert type="error" dismissable={true} on:close={() => error = ''}>
        {error}
      </Alert>
    {/if}
    
    <!-- Pod list section -->
    <Card title="Your Pods" elevation="raised" padding="default">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each pods as pod}
          <Card elevation="flat" padding="default">
            <h3 class="text-lg font-medium text-gray-900">{pod.name}</h3>
            <div class="mt-2 space-y-2">
              {#each podDecks[pod.id] || [] as deck}
                <div class="flex items-center justify-between bg-white p-2 rounded">
                  <span class="text-sm text-gray-700">{deck.name}</span>
                  <Button 
                    variant="error" 
                    size="sm"
                    on:click={() => handleRemoveDeckFromPod(deck.id)}
                  >
                    Remove
                  </Button>
                </div>
              {/each}
            </div>
            
            <div slot="footer">
              <Button 
                variant="error"
                fullWidth={true}
                on:click={() => handleRemoveFromPod(pod.id)}
              >
                Leave Pod
              </Button>
            </div>
          </Card>
        {/each}
      </div>
    </Card>

    <!-- Forms section -->
    <div class="grid gap-6 sm:grid-cols-2">
      <!-- Add user form -->
      <Card title="Add User to Pod" elevation="raised" padding="default">
        <form on:submit|preventDefault={handleAddToPod} class="space-y-4">
          <Input
            id="newUser"
            label="Username"
            bind:value={newUser}
            placeholder="Enter username"
            required={true}
          />
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth={true}
          >
            Add User
          </Button>
        </form>
      </Card>

      <!-- Add deck form -->
      <Card title="Add Deck to Pod" elevation="raised" padding="default">
        <form on:submit|preventDefault={handleAddDeckToPod} class="space-y-4">
          <Input
            id="newDeck"
            label="Deck Name"
            bind:value={newDeck}
            placeholder="Enter deck name"
            required={true}
          />
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth={true}
          >
            Add Deck
          </Button>
        </form>
      </Card>
    </div>

    <!-- Win/Loss tracking section -->
    <Card title="Update Win/Loss Record" elevation="raised" padding="default">
      <form on:submit|preventDefault={handleUpdateWinLoss} class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input 
            id="deckSelect"
            label="Select Deck"
            bind:value={deckId}
            placeholder="Enter deck ID"
            required={true}
          />
          <Input
            id="wins"
            label="Wins"
            type="number"
            value={win.toString()}
            on:input={(e: Event) => {
              const target = e.target as HTMLInputElement;
              win = +target.value || 0;
            }}
            required={true}
          />
          <Input
            id="losses"
            label="Losses"
            type="number"
            value={loss.toString()}
            on:input={(e: Event) => {
              const target = e.target as HTMLInputElement;
              loss = +target.value || 0;
            }}
            required={true}
          />
        </div>
        <Button 
          type="submit" 
          variant="primary"
        >
          Update Record
        </Button>
      </form>
    </Card>

    <!-- Trade management section -->
    <Card title="Manage Trades" elevation="raised" padding="default">
      <div class="pod-container">
        <div class="trades-section">
          <h3 class="text-xl font-medium mb-4">Pod Trades</h3>
          <TradeNotifications />
          
          <Card title="Create New Trade" elevation="flat" padding="default" class="mt-4">
            {#if loadingParticipants}
              <p>Loading participants...</p>
            {:else}
              <div class="participants">
                <h4 class="text-lg font-medium mb-2">Select Participants</h4>
                {#each participants as participant}
                  <div class="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      id="participant-{participant.userId}" 
                      bind:group={selectedParticipants} 
                      value={participant.userId} 
                      class="mr-2"
                    />
                    <label for="participant-{participant.userId}">
                      {participant.username}
                    </label>
                  </div>
                {/each}
              </div>
              
              <div class="cards mt-4">
                <h4 class="text-lg font-medium mb-2">Select Cards to Trade</h4>
                <!-- Card selection UI would go here -->
                <p class="text-sm text-gray-500">Card selection interface to be implemented</p>
              </div>
              
              <div class="mt-4">
                <Button 
                  on:click={createTrade} 
                  disabled={!selectedCards.length || !selectedParticipants.length}
                  variant="success"
                >
                  Create Trade
                </Button>
              </div>
            {/if}
          </Card>
        </div>
      </div>
    </Card>
  </div>
</main>

<style>
  /* Custom styles that aren't covered by the UI component system */
  .pod-container {
    padding: 0;
  }

  .trades-section {
    max-width: 800px;
    margin: 0 auto;
  }
</style>

