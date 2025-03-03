<script lang='ts'>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/userStore';
  import { goto } from '$app/navigation';

  let currentUser: any = null;
  
  // Subscribe to the user store
  user.subscribe(value => {
    currentUser = value;
  });

  onMount(async () => {
    if (!currentUser) {
      // If no user is in the store, try to fetch from API
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        
        if (data.user) {
          // Update the store with the user data
          user.set(data.user);
        } else {
          // Not logged in, redirect to login page
          goto('/');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        goto('/');
      }
    }
  });
</script>

{#if currentUser}
  <div class="profile-container">
    <h1>Your Profile</h1>
    <div class="profile-details">
      <div class="profile-field">
        <span class="label">Username:</span>
        <span class="value">{currentUser.username}</span>
      </div>
      {#if currentUser.name}
        <div class="profile-field">
          <span class="label">Name:</span>
          <span class="value">{currentUser.name}</span>
        </div>
      {/if}
      {#if currentUser.email}
        <div class="profile-field">
          <span class="label">Email:</span>
          <span class="value">{currentUser.email}</span>
        </div>
      {/if}
    </div>
    <div class="grid-container">
      <a href="/auth/decks" class="grid-item">View Your Decks</a>
      <a href="/auth/pods" class="grid-item">View Your Pods</a>
      <a href="/auth/collection" class="grid-item">View Your Collection</a>
      <a href="/auth/trades" class="grid-item">View Your Trades</a>
    </div>
  </div>
{:else}
  <div class="loading-container">
    <p>Loading user information...</p>
  </div>
{/if}

<style>
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
  }

  .profile-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 32px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .profile-container h1 {
    text-align: center;
    margin-bottom: 24px;
    font-size: 28px;
    color: #333;
  }

  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .profile-field {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
  }

  .profile-field:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    color: #555;
  }

  .value {
    color: #333;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 24px;
  }

  .grid-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-decoration: none;
    color: #333;
    transition: background-color 0.2s;
  }

  .grid-item:hover {
    background-color: #e2e6ea;
  }
</style>