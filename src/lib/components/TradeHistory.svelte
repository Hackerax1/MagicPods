<script lang="ts">
  import { onMount } from 'svelte';
  import { tradeStore } from '../stores/tradeStore';
  import { get } from 'svelte/store';

  let trades = [];
  let loading = true;

  onMount(async () => {
    await loadTradeHistory();
  });

  async function loadTradeHistory() {
    try {
      const response = await fetch('/api/trades/history');
      const data = await response.json();
      if (data.success) {
        trades = data.trades;
        tradeStore.setTrades(data.trades);
      }
    } catch (error) {
      console.error('Failed to load trade history:', error);
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }
</script>

<div class="trade-history">
  <h2 class="text-xl font-semibold mb-4">Trade History</h2>
  
  {#if loading}
    <p class="text-gray-600">Loading trade history...</p>
  {:else if trades.length === 0}
    <p class="text-gray-600">No trade history available</p>
  {:else}
    <div class="trades-list">
      {#each trades as trade}
        <div class="trade-item">
          <div class="trade-header">
            <span class="trade-date">
              {new Date(trade.createdAt).toLocaleDateString()}
            </span>
            <span class="trade-status {getStatusColor(trade.status)}">
              {trade.status}
            </span>
          </div>
          
          <div class="trade-details">
            <p class="text-sm text-gray-600">Trade ID: {trade.id}</p>
            <p class="text-sm text-gray-600">
              Last updated: {new Date(trade.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .trade-history {
    padding: 1rem;
  }

  .trades-list {
    display: grid;
    gap: 1rem;
  }

  .trade-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    background-color: white;
  }

  .trade-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .trade-date {
    font-weight: 500;
  }

  .trade-status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .trade-details {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
  }
</style>