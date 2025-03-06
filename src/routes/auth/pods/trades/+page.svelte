<script lang="ts">
  import TradeNotifications from '$lib/components/TradeNotifications.svelte';
  import TradeHistory from '$lib/components/TradeHistory.svelte';
  import { page } from '$app/stores';
  import { tradeStore } from '$lib/stores/tradeStore';

  let selectedPodId = $page.url.searchParams.get('podId');
</script>

<div class="container mx-auto px-4 py-6">
  <div class="grid gap-6">
    <!-- Trade notifications section -->
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 class="text-xl font-semibold mb-4">Trade Notifications</h2>
      <TradeNotifications />
    </div>

    <!-- Trade history section -->
    <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <TradeHistory />
    </div>
  </div>
</div>

<style>
  :global(.notification) {
    margin-bottom: 1rem;
  }
</style>