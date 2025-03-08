<script lang="ts">
  import { onMount } from 'svelte';
  import { tradeStore } from '../stores/tradeStore';
  
  export let podId: string;
  export let onClose: () => void = () => {};
  
  let podMembers = [];
  let loading = false;
  let error = '';
  let success = '';
  let selectedMembers = [];
  let tradeItems = [];
  let userCards = [];
  
  // For each participant, we track their offered cards
  let participantOffers = {};
  
  onMount(async () => {
    await loadPodMembers();
    await loadUserCards();
  });
  
  async function loadPodMembers() {
    try {
      loading = true;
      const response = await fetch(`/api/pods/${podId}/members`);
      const data = await response.json();
      
      if (data.success) {
        podMembers = data.members;
        // Initialize current user as selected
        const currentUser = data.currentUser;
        if (currentUser) {
          selectedMembers = [currentUser];
          participantOffers[currentUser.id] = [];
        }
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
  
  function toggleMemberSelection(member) {
    const index = selectedMembers.findIndex(m => m.id === member.id);
    
    if (index === -1) {
      selectedMembers = [...selectedMembers, member];
      participantOffers[member.id] = [];
    } else {
      selectedMembers = selectedMembers.filter(m => m.id !== member.id);
      delete participantOffers[member.id];
    }
  }
  
  function addCardToOffer(userId, card, quantity = 1) {
    if (!participantOffers[userId]) {
      participantOffers[userId] = [];
    }
    
    const existingCardIndex = participantOffers[userId].findIndex(item => item.card.id === card.id);
    
    if (existingCardIndex >= 0) {
      // Update quantity if card already in offer
      const maxQuantity = card.quantity || 1;
      const newQuantity = Math.min(participantOffers[userId][existingCardIndex].quantity + quantity, maxQuantity);
      
      participantOffers[userId][existingCardIndex].quantity = newQuantity;
    } else {
      // Add new card to offer
      participantOffers[userId].push({
        card,
        quantity: Math.min(quantity, card.quantity || 1)
      });
    }
    
    // Force reactivity
    participantOffers = { ...participantOffers };
  }
  
  function removeCardFromOffer(userId, cardId) {
    if (participantOffers[userId]) {
      participantOffers[userId] = participantOffers[userId].filter(item => item.card.id !== cardId);
      
      // Force reactivity
      participantOffers = { ...participantOffers };
    }
  }
  
  function updateCardQuantity(userId, cardId, newQuantity) {
    if (participantOffers[userId]) {
      const cardIndex = participantOffers[userId].findIndex(item => item.card.id !== cardId);
      
      if (cardIndex >= 0) {
        const card = participantOffers[userId][cardIndex].card;
        const maxQuantity = card.quantity || 1;
        
        participantOffers[userId][cardIndex].quantity = Math.min(Math.max(1, newQuantity), maxQuantity);
        
        // Force reactivity
        participantOffers = { ...participantOffers };
      }
    }
  }
  
  async function createMultiwayTrade() {
    // Validate that we have at least 2 participants
    if (selectedMembers.length < 2) {
      error = 'A multiway trade requires at least 2 participants';
      return;
    }
    
    // Validate that at least one participant has offered cards
    let hasOffers = false;
    for (const userId in participantOffers) {
      if (participantOffers[userId].length > 0) {
        hasOffers = true;
        break;
      }
    }
    
    if (!hasOffers) {
      error = 'At least one participant must offer cards for the trade';
      return;
    }
    
    try {
      loading = true;
      error = '';
      
      // Create the trade
      const tradeData = {
        podId,
        participants: selectedMembers.map(m => m.id),
        items: []
      };
      
      // Add items from current user
      const currentUser = selectedMembers.find(m => m.id === podMembers.find(pm => pm.isCurrentUser)?.id);
      
      if (currentUser && participantOffers[currentUser.id]) {
        participantOffers[currentUser.id].forEach(offer => {
          tradeData.items.push({
            userCardId: offer.card.id,
            quantity: offer.quantity
          });
        });
      }
      
      const response = await fetch('/api/trades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tradeData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        success = 'Multiway trade created successfully!';
        
        // Update trade store
        if (data.trade) {
          tradeStore.addTrade(data.trade);
        }
        
        setTimeout(() => {
          success = '';
          onClose();
        }, 2000);
      } else {
        error = data.message || 'Failed to create multiway trade';
      }
    } catch (err) {
      error = 'An error occurred while creating the multiway trade';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="multiway-trade p-4 bg-white rounded-lg shadow">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Create Multiway Trade</h2>
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
  
  <div class="mb-6">
    <h3 class="text-lg font-medium mb-2">Select Participants</h3>
    
    {#if loading && podMembers.length === 0}
      <p class="text-gray-600">Loading pod members...</p>
    {:else if podMembers.length === 0}
      <p class="text-gray-600">No members found in this pod</p>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {#each podMembers as member}
          <div 
            class="p-2 border rounded cursor-pointer {selectedMembers.some(m => m.id === member.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}"
            on:click={() => toggleMemberSelection(member)}
            on:keydown={(e) => e.key === 'Enter' && toggleMemberSelection(member)}
            role="button"
            tabindex="0"
          >
            <div class="flex items-center">
              <input 
                type="checkbox" 
                checked={selectedMembers.some(m => m.id === member.id)}
                class="mr-2"
                readonly
              />
              <span>{member.username}</span>
              {#if member.isCurrentUser}
                <span class="ml-1 text-xs text-gray-500">(you)</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  {#if selectedMembers.length > 0}
    <div class="mb-6">
      <h3 class="text-lg font-medium mb-2">Trade Offers</h3>
      
      <div class="grid grid-cols-1 gap-4">
        {#each selectedMembers as member}
          <div class="border rounded p-3">
            <h4 class="font-medium mb-2">
              {member.username}
              {#if member.isCurrentUser}
                <span class="text-xs text-gray-500">(you)</span>
              {/if}
            </h4>
            
            {#if member.isCurrentUser}
              <!-- Current user can add cards from their collection -->
              <div class="mb-3">
                <h5 class="text-sm font-medium mb-1">Your Cards</h5>
                
                {#if loading && userCards.length === 0}
                  <p class="text-sm text-gray-600">Loading your cards...</p>
                {:else if userCards.length === 0}
                  <p class="text-sm text-gray-600">You don't have any cards in your collection</p>
                {:else}
                  <div class="max-h-40 overflow-y-auto border rounded">
                    {#each userCards as card}
                      <div class="p-2 border-b last:border-b-0 hover:bg-gray-50 flex justify-between items-center">
                        <div>
                          <div>{card.name}</div>
                          <div class="text-xs text-gray-600">Condition: {card.condition} • Available: {card.quantity}</div>
                        </div>
                        <button 
                          on:click={() => addCardToOffer(member.id, card)}
                          class="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
            
            <div>
              <h5 class="text-sm font-medium mb-1">Offered Cards</h5>
              
              {#if !participantOffers[member.id] || participantOffers[member.id].length === 0}
                <p class="text-sm text-gray-600">No cards offered yet</p>
              {:else}
                <div class="border rounded">
                  {#each participantOffers[member.id] as offer}
                    <div class="p-2 border-b last:border-b-0 flex justify-between items-center">
                      <div>
                        <div>{offer.card.name}</div>
                        <div class="text-xs text-gray-600">
                          Condition: {offer.card.condition} • Quantity: {offer.quantity}
                        </div>
                      </div>
                      
                      {#if member.isCurrentUser}
                        <button 
                          on:click={() => removeCardFromOffer(member.id, offer.card.id)}
                          class="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="flex justify-end">
      <button 
        on:click={createMultiwayTrade}
        disabled={loading || selectedMembers.length < 2}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Multiway Trade'}
      </button>
    </div>
  {/if}
</div>
