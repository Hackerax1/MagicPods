<script lang="ts">
  import { goto } from '$app/navigation';
  import { setUser } from '$lib/stores/userStore';

  let identifier = '';
  let password = '';
  let error = '';
  let loading = false;

  const handleLogin = async () => {
    error = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'login',
          identifier, 
          password 
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        error = result.error || 'Login failed. Please check your credentials.';
      } else {
        // Store the user in the client-side store
        setUser(result.user);
        // Navigate to authenticated area
        goto('/auth');
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'An unexpected error occurred. Please try again.';
    } finally {
      loading = false;
    }
  };
</script>

<div class="login-form">
  <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
      <span>{error}</span>
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleLogin} class="space-y-4">
    <div>
      <label for="identifier" class="block text-sm font-medium text-gray-700">Username or Email:</label>
      <input type="text" id="identifier" bind:value={identifier} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password:</label>
      <input type="password" id="password" bind:value={password} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
    </div>
    <div class="flex justify-between">
      <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  </form>
</div>

<style>
  .login-form {
    max-width: 400px;
    margin: auto;
  }
</style>
