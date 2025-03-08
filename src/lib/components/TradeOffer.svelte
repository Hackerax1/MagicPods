<script lang="ts">
  import { onMount } from 'svelte';
  import { tradeStore } from '../stores/tradeStore';
  import type { Trade } from '../stores/tradeStore';
  
  export let podId: string = '';
  export let onTradeComplete: () => void = () => {};
  
  let loading = false;
  let error = '';
  let success = '';
  let selectedCards = [];
  let selectedQuantities = {};
  let participants = [];
  let userCards = [];
  let selectedParticipants = [];
  
  onMount(async () => {
    await loadUserCards();
    await loadPodMembers();
  });
  
  async function loadUserCards() {
    try {
      loading = true;
      const response = await fetch('/api/collection');
      const data = await response.json();
      if (data.success) {
        userCards = data.cards;
      } else {
        error = data.message || 'Failed to load your cards';
      }
    } catch (err) {
      error = 'An error occurred while loading your cards';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function loadPodMembers() {
    try {
      loading = true;
      const response = await fetch(`/api/pods/${podId}/members`);
      const data = await response.json();
      if (data.success) {
        participants = data.members.filter(member => member.id !== data.currentUser.id);
      } else {
        error = data.message || 'Failed to load pod members';
      }
    } catch (err) {
      error = 'An error occurred while loading pod members';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  function toggleCardSelection(card) {
    const index = selectedCards.findIndex(c => c.id === card.id);
    if (index === -1) {
      selectedCards = [...selectedCards, card];
      selectedQuantities[card.id] = 1;
    } else {
      selectedCards = selectedCards.filter(c => c.id !== card.id);
      delete selectedQuantities[card.id];
    }
  }
  
  function toggleParticipantSelection(participant) {
    const index = selectedParticipants.findIndex(p => p.id === participant.id);
    if (index === -1) {
      selectedParticipants = [...selectedParticipants, participant];
    } else {
      selectedParticipants = selectedParticipants.filter(p => p.id !== participant.id);
    }
  }
  
  function updateQuantity(cardId, quantity) {
    selectedQuantities[cardId] = Math.max(1, Math.min(quantity, 
      userCards.find(c => c.id === cardId)?.quantity || 1));
  }
  
  async function createTradeOffer() {
    if (selectedCards.length === 0) {
      error = 'Please select at least one card to offer';
      return;
    }
    
    if (selectedParticipants.length === 0) {
      error = 'Please select at least one participant for the trade';
      return;
    }
    
    try {
      loading = true;
      error = '';
      
      const tradeItems = selectedCards.map(card => ({
        userCardId: card.id,
        quantity: selectedQuantities[card.id]
      }));
      
      const tradeData = {
        podId,
        participants: selectedParticipants.map(p => p.id),
        items: tradeItems
      };
      
      const response = await fetch('/api/trades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tradeData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        success = 'Trade offer created successfully!';
        // Reset selections
        selectedCards = [];
        selectedQuantities = {};
        selectedParticipants = [];
        
        // Update trade store
        if (data.trade) {
          tradeStore.addTrade(data.trade);
        }
        
        setTimeout(() => {
          success = '';
          if (onTradeComplete) onTradeComplete();
        }, 2000);
      } else {
        error = data.message || 'Failed to create trade offer';
      }
    } catch (err) {
      error = 'An error occurred while creating the trade offer';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="trade-offer p-4 bg-white rounded-lg shadow">
  <h2 class="text-xl font-semibold mb-4">Create Trade Offer</h2>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      {success}
    </div>
  {/if}
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Card Selection -->
    <div>
      <h3 class="text-lg font-medium mb-2">Select Cards to Offer</h3>
      {#if loading && userCards.length === 0}
        <p class="text-gray-600">Loading your cards...</p>
      {:else if userCards.length === 0}
        <p class="text-gray-600">You don't have any cards in your collection</p>
      {:else}
        <div class="max-h-80 overflow-y-auto border rounded p-2">
          {#each userCards as card}
            <div class="card-item flex items-center justify-between p-2 hover:bg-gray-50 {selectedCards.some(c => c.id === card.id) ? 'bg-blue-50' : ''}">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id={`card-${card.id}`} 
                  checked={selectedCards.some(c => c.id === card.id)}
                  on:change={() => toggleCardSelection(card)}
                  class="mr-2"
                />
                <label for={`card-${card.id}`} class="cursor-pointer">
                  {card.name} ({card.condition})
                </label>
              </div>
              <div class="text-sm text-gray-600">
                Available: {card.quantity}
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      {#if selectedCards.length > 0}
        <div class="mt-4">
          <h4 class="text-md font-medium mb-2">Selected Cards</h4>
          <div class="border rounded p-2">
            {#each selectedCards as card}
              <div class="flex items-center justify-between p-2 border-b last:border-b-0">
                <div>{card.name}</div>
                <div class="flex items-center">
                  <button 
                    on:click={() => updateQuantity(card.id, (selectedQuantities[card.id] || 1) - 1)}
                    class="px-2 py-1 bg-gray-200 rounded-l"
                    disabled={selectedQuantities[card.id] <= 1}
                  >-</button>
                  <span class="px-3 py-1 bg-gray-100">{selectedQuantities[card.id] || 1}</span>
                  <button 
                    on:click={() => updateQuantity(card.id, (selectedQuantities[card.id] || 1) + 1)}
                    class="px-2 py-1 bg-gray-200 rounded-r"
                    disabled={selectedQuantities[card.id] >= (card.quantity || 1)}
                  >+</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Participant Selection -->
    <div>
      <h3 class="text-lg font-medium mb-2">Select Trade Participants</h3>
      {#if loading && participants.length === 0}
        <p class="text-gray-600">Loading pod members...</p>
      {:else if participants.length === 0}
        <p class="text-gray-600">No other members in this pod</p>
      {:else}
        <div class="max-h-80 overflow-y-auto border rounded p-2">
          {#each participants as participant}
            <div class="participant-item flex items-center p-2 hover:bg-gray-50 {selectedParticipants.some(p => p.id === participant.id) ? 'bg-blue-50' : ''}">
              <input 
                type="checkbox" 
                id={`participant-${participant.id}`} 
                checked={selectedParticipants.some(p => p.id === participant.id)}
                on:change={() => toggleParticipantSelection(participant)}
                class="mr-2"
              />
              <label for={`participant-${participant.id}`} class="cursor-pointer">
                {participant.username}
              </label>
            </div>
          {/each}
        </div>
      {/if}
      
      {#if selectedParticipants.length > 0}
        <div class="mt-4">
          <h4 class="text-md font-medium mb-2">Selected Participants</h4>
          <div class="border rounded p-2">
            {#each selectedParticipants as participant}
              <div class="p-2 border-b last:border-b-0">
                {participant.username}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="mt-6 flex justify-end">
    <button 
      on:click={createTradeOffer}
      disabled={loading || selectedCards.length === 0 || selectedParticipants.length === 0}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? 'Creating...' : 'Create Trade Offer'}
    </button>
  </div>
</div>
