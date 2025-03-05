<script lang='ts'>
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let username = '';
  let error = '';
  let loading = false;
  let showPassword = false;
  let passwordStrength = 0;

  function validatePassword(pass: string) {
    let strength = 0;
    if (pass.length >= 8) strength++; // Length check
    if (/[A-Z]/.test(pass)) strength++; // Contains uppercase
    if (/[a-z]/.test(pass)) strength++; // Contains lowercase
    if (/[0-9]/.test(pass)) strength++; // Contains number
    if (/[^A-Za-z0-9]/.test(pass)) strength++; // Contains special char
    return strength;
  }

  function handlePasswordInput() {
    passwordStrength = validatePassword(password);
  }

  async function handleRegister() {
    // Reset error state
    error = '';
    
    // Validate form input
    if (password !== confirmPassword) {
      error = "Passwords don't match";
      return;
    }
    
    if (passwordStrength < 3) {
      error = "Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters";
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register',
          email, 
          username, 
          password 
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        error = result.error || 'Registration failed. Please try again.';
        console.error('Failed to register user:', result.error);
      } else {
        // Registration successful, redirect to login
        goto('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
      error = 'An unexpected error occurred. Please try again.';
    } finally {
      loading = false;
    }
  };
  
  function toggleShowPassword() {
    showPassword = !showPassword;
  }
</script>

<div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold text-center text-gray-900">Create Your Account</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Join our community and start building your decks
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
    
    <form on:submit|preventDefault={handleRegister} class="mt-8 space-y-6">
      <!-- Email field -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
        <div class="relative mt-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
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
      
      <!-- Username field -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
        <div class="relative mt-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
          <input 
            type="text" 
            id="username" 
            bind:value={username} 
            required 
            class="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
            placeholder="Choose a username"
          />
        </div>
      </div>
      
      <!-- Password field -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <div class="relative mt-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            id="password" 
            bind:value={password} 
            on:input={handlePasswordInput}
            required 
            class="block w-full rounded-md border border-gray-300 pl-10 pr-12 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
            placeholder="Create a strong password"
          />
          <button 
            type="button" 
            on:click={toggleShowPassword}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-600"
          >
            {#if showPassword}
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {:else}
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        <!-- Password strength indicator -->
        {#if password}
          <div class="mt-2 space-y-1">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength === 0 ? 'bg-red-500 w-1/5' : 
                  passwordStrength === 1 ? 'bg-red-500 w-2/5' : 
                  passwordStrength === 2 ? 'bg-yellow-500 w-3/5' :
                  passwordStrength === 3 ? 'bg-yellow-500 w-4/5' :
                  'bg-green-500 w-full'
                }`}
              ></div>
            </div>
            <p class="text-xs text-gray-600">
              {#if passwordStrength < 3}
                Password must include uppercase, lowercase, numbers, and special characters
              {:else}
                Password strength is good
              {/if}
            </p>
          </div>
        {/if}
      </div>
      
      <!-- Confirm Password field -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
        <div class="relative mt-1">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <input 
            type={showPassword ? "text" : "password"} 
            id="confirmPassword" 
            bind:value={confirmPassword} 
            required 
            class="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
            placeholder="Confirm your password"
          />
        </div>
        {#if confirmPassword && password !== confirmPassword}
          <p class="mt-1 text-sm text-red-600">Passwords don't match</p>
        {/if}
      </div>

      <!-- Terms & Conditions -->
      <div class="flex items-start space-x-3">
        <input 
          id="terms" 
          name="terms" 
          type="checkbox" 
          required 
          class="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        >
        <div class="text-sm">
          <label for="terms" class="font-medium text-gray-700">
            I agree to the <a href="/terms" class="text-indigo-600 hover:text-indigo-500">Terms</a> and <a href="/privacy" class="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
          </label>
          <p class="mt-1 text-gray-500">
            By creating an account, you agree to receive updates and notifications.
          </p>
        </div>
      </div>
      
      <!-- Submit button -->
      <div>
        <button 
          type="submit" 
          class="group relative flex w-full justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || (password !== confirmPassword) || (passwordStrength < 3)}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <div class="text-center text-sm">
        <p class="text-gray-600">
          Already have an account? 
          <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in instead
          </a>
        </p>
      </div>
    </form>
  </div>
</div>

<style>
  .register-form {
    max-width: 400px;
    margin: auto;
  }
</style>


