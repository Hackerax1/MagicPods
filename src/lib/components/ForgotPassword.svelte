<script lang="ts">
  let email = '';
  let error = '';
  let loading = false;
  let successMessage = '';

  const handleForgotPassword = async () => {
    error = '';
    loading = true;
    successMessage = '';
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'forgotPassword',
          email
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        error = result.error || 'Failed to send reset email. Please try again.';
      } else {
        successMessage = 'Password reset instructions have been sent to your email.';
        email = '';
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      error = 'An unexpected error occurred. Please try again.';
    } finally {
      loading = false;
    }
  };
</script>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold text-center text-gray-900">Reset Your Password</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password
      </p>
    </div>

    {#if error}
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md" role="alert">
        <div class="flex items-center space-x-3">
          <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm text-red-700">{error}</span>
        </div>
      </div>
    {/if}

    {#if successMessage}
      <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-md" role="alert">
        <div class="flex items-center space-x-3">
          <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-sm text-green-700">{successMessage}</span>
        </div>
      </div>
    {/if}

    <form on:submit|preventDefault={handleForgotPassword} class="mt-8 space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
        <div class="relative mt-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <input 
            type="email" 
            id="email" 
            bind:value={email} 
            required 
            class="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <button 
          type="submit" 
          class="group relative flex w-full justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          {:else}
            Send Reset Link
          {/if}
        </button>
      </div>

      <div class="text-center text-sm">
        <p class="text-gray-600">
          Remember your password?
          <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in here
          </a>
        </p>
      </div>
    </form>
  </div>
</div>