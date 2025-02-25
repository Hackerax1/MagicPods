<script lang='ts'>
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let username = '';

  async function handleRegister() {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const result = await response.json();
      console.log('Register response:', result);
      if (!response.ok) {
        console.error('Failed to register user.');
        return;
      } else {
        goto('/auth');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };
</script>

<div class="register-form">
  <h2 class="text-2xl font-bold mb-4 text-center">Enter Your Details</h2>
  <form on:submit|preventDefault={handleRegister} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email:</label>
      <input type="email" id="email" bind:value={email} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    </div>
    <div>
      <label for="username" class="block text-sm font-medium text-gray-700">Username:</label>
      <input type="text" id="username" bind:value={username} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password:</label>
      <input type="password" id="password" bind:value={password} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    </div>
    <div class="flex justify-between">
      <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Submit</button>
    </div>
  </form>
</div>

<style>
  .register-form {
    max-width: 400px;
    margin: auto;
  }
</style>


