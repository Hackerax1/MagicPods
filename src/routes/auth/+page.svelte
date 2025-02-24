<script lang='ts'>
  import { onMount } from 'svelte';
  // Remove server-side import
  // import { validateSessionToken } from '$lib/server/auth';

  export let sessionToken: string | null = null;
  export let session: any = null;

  onMount(async () => {
    if (sessionToken) {
      // Replace with client-side validation or fetch session data from an API endpoint
      // session = await validateSessionToken(sessionToken);
      session = await fetch('/api/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: sessionToken })
      }).then(res => res.json());
    }
  });
</script>

{#if session?.user}
  <div class="profile-container">
    <h1>Your Profile</h1>
    <div class="profile-details">
      <div class="profile-field">
        <span class="label">Name:</span>
        <span class="value">{session.user.name}</span>
      </div>
      <div class="profile-field">
        <span class="label">Email:</span>
        <span class="value">{session.user.email}</span>
      </div>
      <div class="profile-field">
        <span class="label">Username:</span>
        <span class="value">{session.user.username}</span>
      </div>
    </div>
    <div class="navigation-links">
      <a href="/auth/pods" class="nav-link">View Your Pods</a>
      <a href="/auth/decks" class="nav-link">View Your Decks</a>
    </div>
    <div class="grid-container">
      <a href="/auth/decks" class="grid-item">View Your Decks</a>
      <a href="/auth/pods" class="grid-item">View Your Pods</a>
      <a href="/auth/collection" class="grid-item">View Your Collection</a>
      <a href="/auth/trades" class="grid-item">View Your Trades</a>
    </div>
  </div>
{:else}
  <p>Please log in to view your profile.</p>
{/if}

<style>
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

  .navigation-links {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
  }

  .nav-link {
    padding: 10px 16px;
    background-color: #007bff;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    transition: background-color 0.2s;
  }

  .nav-link:hover {
    background-color: #0056b3;
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