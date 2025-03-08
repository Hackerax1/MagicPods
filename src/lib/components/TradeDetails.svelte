<script lang="ts">
  import { onMount } from 'svelte';
  import { tradeStore } from '../stores/tradeStore';
  
  export let tradeId: string;
  export let onClose: () => void = () => {};
  
  let trade = null;
  let participants = [];
  let items = [];
  let loading = true;
  let error = '';
  let success = '';
  let userCards = [];
  let selectedCard = null;
  let offerQuantity = 1;
  
  onMount(async () => {
    await loadTradeDetails();
    await loadUserCards();
  });
  
  async function loadTradeDetails() {
    try {
      loading = true;
      const response = await fetch(`/api/trades?tradeId=${tradeId}`);
      const data = await response.json();
      
      if (data.success) {
        trade = data.trade;
        participants = data.participants;
        items = data.items;
        
        // Enhance items with card details
        await Promise.all(items.map(async (item) => {
          const cardResponse = await fetch(`/api/collection/card?cardId=${item.userCardId}`);
          const cardData = await cardResponse.json();
          if (cardData.success) {
            item.cardDetails = cardData.card;
            
            // Get owner details
            const userResponse = await fetch(`/api/users/${item.cardDetails.userId}`);
            const userData = await userResponse.json();
            if (userData.success) {
              item.ownerDetails = userData.user;
            }
          }
        }));
      } else {
        error = data.message || 'Failed to load trade details';
      }
    } catch (err) {
      error = 'An error occurred while loading trade details';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function loadUserCards() {
    try {
      const response = await fetch('/api/collection');
      const data = await response.json();
      if (data.success) {
        userCards = data.cards;
      }
    } catch (err) {
      console.error('Failed to load user cards:', err);
    }
  }
  
  async function updateTradeStatus(status) {
    try {
      loading = true;
      error = '';
      success = '';
      
      const response = await fetch(`/api/trades/${tradeId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        trade = data.trade;
        tradeStore.updateTradeStatus(tradeId, status);
        success = `Trade ${status} successfully`;
        
        setTimeout(() => {
          success = '';
          if (status === 'completed' || status === 'rejected' || status === 'cancelled') {
            onClose();
          }
        }, 2000);
      } else {
        error = data.message || `Failed to update trade status to ${status}`;
      }
    } catch (err) {
      error = 'An error occurred while updating trade status';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function addItemToTrade() {
    if (!selectedCard) {
      error = 'Please select a card to add to the trade';
      return;
    }
    
    if (offerQuantity < 1) {
      error = 'Quantity must be at least 1';
      return;
    }
    
    try {
      loading = true;
      error = '';
      
      const response = await fetch(`/api/trades/${tradeId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCardId: selectedCard.id,
          quantity: offerQuantity
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        success = 'Card added to trade successfully';
        selectedCard = null;
        offerQuantity = 1;
        
        // Refresh trade details
        await loadTradeDetails();
        
        setTimeout(() => {
          success = '';
        }, 2000);
      } else {
        error = data.message || 'Failed to add card to trade';
      }
    } catch (err) {
      error = 'An error occurred while adding card to trade';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="trade-details p-4 bg-white rounded-lg shadow">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Trade Details</h2>
    <button 
      on:click={onClose}
      class="text-gray-500 hover:text-gray-700"
    >
      ✕
    </button>
  </div>
  
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
  
  {#if loading && !trade}
    <div class="text-center py-8">
      <p class="text-gray-600">Loading trade details...</p>
    </div>
  {:else if trade}
    <div class="trade-info mb-6">
      <div class="flex justify-between items-center mb-2">
        <div>
          <span class="text-gray-600">Status:</span> 
          <span class="px-2 py-1 rounded-full text-sm font-medium
            {trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
            {trade.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
            {trade.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
            {trade.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
          ">
            {trade.status}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          Created: {new Date(trade.createdAt).toLocaleString()}
        </div>
      </div>
      
      <div class="text-sm text-gray-600">
        Last updated: {new Date(trade.updatedAt).toLocaleString()}
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Participants -->
      <div>
        <h3 class="text-lg font-medium mb-2">Participants</h3>
        <div class="border rounded">
          {#if participants.length === 0}
            <p class="p-3 text-gray-600">No participants found</p>
          {:else}
            {#each participants as participant}
              <div class="p-3 border-b last:border-b-0">
                {participant.username || participant.userId}
              </div>
            {/each}
          {/if}
        </div>
      </div>
      
      <!-- Trade Items -->
      <div>
        <h3 class="text-lg font-medium mb-2">Trade Items</h3>
        <div class="border rounded">
          {#if items.length === 0}
            <p class="p-3 text-gray-600">No items in this trade yet</p>
          {:else}
            {#each items as item}
              <div class="p-3 border-b last:border-b-0">
                <div class="flex justify-between items-center">
                  <div>
                    {#if item.cardDetails}
                      <div class="font-medium">{item.cardDetails.name}</div>
                      <div class="text-sm text-gray-600">
                        Quantity: {item.quantity} • Condition: {item.cardDetails.condition}
                      </div>
                    {:else}
                      <div class="text-gray-600">Loading card details...</div>
                    {/if}
                  </div>
                  <div class="text-sm text-gray-600">
                    {#if item.ownerDetails}
                      Offered by: {item.ownerDetails.username}
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
    
    {#if trade.status === 'pending'}
      <!-- Add Item to Trade -->
      <div class="mt-6 border-t pt-4">
        <h3 class="text-lg font-medium mb-2">Add Card to Trade</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="card-select" class="block text-sm font-medium text-gray-700 mb-1">Select Card</label>
            <select 
              id="card-select" 
              bind:value={selectedCard}
              class="w-full p-2 border rounded"
            >
              <option value={null}>-- Select a card --</option>
              {#each userCards as card}
                <option value={card}>{card.name} ({card.condition}) - Qty: {card.quantity}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input 
              type="number" 
              id="quantity" 
              bind:value={offerQuantity}
              min="1" 
              max={selectedCard ? selectedCard.quantity : 1}
              class="w-full p-2 border rounded"
            />
          </div>
          
          <div class="flex items-end">
            <button 
              on:click={addItemToTrade}
              disabled={loading || !selectedCard}
              class="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add to Trade
            </button>
          </div>
        </div>
      </div>
      
      <!-- Trade Actions -->
      <div class="mt-6 flex justify-end space-x-3">
        <button 
          on:click={() => updateTradeStatus('cancelled')}
          disabled={loading}
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Cancel Trade
        </button>
        
        <button 
          on:click={() => updateTradeStatus('rejected')}
          disabled={loading}
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Reject Trade
        </button>
        
        <button 
          on:click={() => updateTradeStatus('accepted')}
          disabled={loading || items.length === 0}
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Accept Trade
        </button>
        
        <button 
          on:click={() => updateTradeStatus('completed')}
          disabled={loading || items.length === 0}
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Complete Trade
        </button>
      </div>
    {:else}
      <div class="mt-6 flex justify-end">
        <button 
          on:click={onClose}
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    {/if}
  {:else}
    <div class="text-center py-8">
      <p class="text-gray-600">Trade not found</p>
    </div>
  {/if}
</div>
