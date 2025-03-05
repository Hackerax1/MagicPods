<script lang='ts'>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/userStore';
  import { goto } from '$app/navigation';
  import type { User } from '$lib/stores/userStore';

  interface Stats {
    decks: { count: number; loading: boolean };
    cards: { count: number; loading: boolean };
    pods: { count: number; loading: boolean };
    recents: Array<{
      type: 'deck' | 'card' | 'pod';
      name: string;
      date: string;
      id: string;
    }>;
  }

  let currentUser: User = null;
  let statsLoading = true;
  let error: string | null = null;
  
  let stats: Stats = {
    decks: { count: 0, loading: true },
    cards: { count: 0, loading: true },
    pods: { count: 0, loading: true },
    recents: []
  };
  
  // Subscribe to the user store
  user.subscribe(value => {
    currentUser = value;
  });

  async function fetchStats() {
    if (!currentUser?.id) return;
    
    try {
      const [decksResponse, cardsResponse, podsResponse] = await Promise.all([
        fetch(`/api/deck?userId=${currentUser.id}`),
        fetch(`/api/collection?userId=${currentUser.id}`),
        fetch(`/api/pods?userId=${currentUser.id}`)
      ]);

      const [decksData, cardsData, podsData] = await Promise.all([
        decksResponse.json(),
        cardsResponse.json(),
        podsResponse.json()
      ]);

      // Get recent activity
      const recentResponse = await fetch(`/api/activity?userId=${currentUser.id}&limit=3`);
      const recentData = await recentResponse.json();

      stats = {
        decks: { count: decksData.total || 0, loading: false },
        cards: { count: cardsData.total || 0, loading: false },
        pods: { count: podsData.total || 0, loading: false },
        recents: recentData.items || []
      };
    } catch (err) {
      console.error('Error fetching stats:', err);
      error = 'Failed to load some dashboard data. Please try refreshing the page.';
    } finally {
      statsLoading = false;
    }
  }

  onMount(async () => {
    if (!currentUser) {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        
        if (data.user) {
          user.set(data.user);
          await fetchStats();
        } else {
          goto('/');
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        error = 'Failed to authenticate. Please try logging in again.';
        goto('/');
      }
    } else {
      await fetchStats();
    }
  });
</script>

{#if error}
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
    <span class="block sm:inline">{error}</span>
  </div>
{/if}

{#if currentUser}
  <div class="dashboard">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-indigo-900 mb-2">Welcome, {currentUser.username}!</h1>
      <p class="text-gray-600">Manage your Magic: The Gathering collection and decks</p>
    </div>

    <!-- Stats Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <!-- Decks Stats -->
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 mb-1">Total Decks</p>
            {#if stats.decks.loading}
              <div class="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            {:else}
              <p class="text-2xl font-bold text-gray-800">{stats.decks.count}</p>
            {/if}
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <a href="/auth/decks" class="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
            View all decks
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Cards Stats -->
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 mb-1">Collection Cards</p>
            {#if stats.cards.loading}
              <div class="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            {:else}
              <p class="text-2xl font-bold text-gray-800">{stats.cards.count}</p>
            {/if}
          </div>
          <div class="bg-purple-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <a href="/auth/collection" class="text-purple-600 hover:text-purple-800 text-sm font-medium inline-flex items-center">
            View collection
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Pods Stats -->
      <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 mb-1">Active Pods</p>
            {#if stats.pods.loading}
              <div class="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            {:else}
              <p class="text-2xl font-bold text-gray-800">{stats.pods.count}</p>
            {/if}
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <a href="/auth/pods" class="text-green-600 hover:text-green-800 text-sm font-medium inline-flex items-center">
            View all pods
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Action Cards -->
    <div class="mb-12">
      <h2 class="text-xl font-bold text-indigo-800 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <a href="/auth/decks/new" class="bg-white hover:bg-indigo-50 border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="font-medium">New Deck</span>
        </a>
        
        <a href="/auth/collection/add" class="bg-white hover:bg-indigo-50 border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
          <span class="font-medium">Add Cards</span>
        </a>
        
        <a href="/auth/pods/create" class="bg-white hover:bg-indigo-50 border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="font-medium">Create Pod</span>
        </a>
        
        <a href="/auth/scanner" class="bg-white hover:bg-indigo-50 border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium">Scan Cards</span>
        </a>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-indigo-800 mb-4">Recent Activity</h2>
      
      {#if statsLoading}
        <div class="space-y-3 animate-pulse">
          <div class="h-10 bg-gray-200 rounded"></div>
          <div class="h-10 bg-gray-200 rounded"></div>
          <div class="h-10 bg-gray-200 rounded"></div>
        </div>
      {:else if stats.recents.length === 0}
        <div class="text-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-gray-500">No recent activity to display</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each stats.recents as item}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if item.type === 'deck'}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Deck
                      </span>
                    {:else if item.type === 'card'}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Card
                      </span>
                    {:else if item.type === 'pod'}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Pod
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">{item.name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/auth/${item.type}s/${item.id}`} class="text-indigo-600 hover:text-indigo-900">View</a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
{/if}