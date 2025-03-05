<script>
  import Login from '../lib/components/Login.svelte';
  import Register from '../lib/components/Register.svelte';
</script>

<div class="hero-section text-center py-12 px-4 md:py-24">
  <h1 class="text-4xl md:text-6xl font-extrabold text-indigo-900 mb-4">
    Welcome to MTGSvelte
  </h1>
  <p class="text-xl md:text-2xl text-indigo-700 max-w-3xl mx-auto mb-8">
    Build decks, manage your collection, and connect with other players in your community.
  </p>
  <div class="inline-flex flex-wrap justify-center gap-4">
    <a href="#auth" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105">
      Get Started
    </a>
    <a href="#features" class="bg-white hover:bg-indigo-50 text-indigo-600 font-bold py-3 px-6 rounded-lg shadow-lg border border-indigo-200 transition-all transform hover:scale-105">
      Learn More
    </a>
  </div>
</div>

<div id="features" class="features-section py-12 bg-white">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12 text-indigo-900">Features</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="feature-card p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow">
        <div class="icon-container bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-center mb-2">Deck Building</h3>
        <p class="text-gray-600 text-center">Create and manage your Magic: The Gathering decks with our intuitive deck builder interface.</p>
      </div>
      <div class="feature-card p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow">
        <div class="icon-container bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-center mb-2">Pods & Communities</h3>
        <p class="text-gray-600 text-center">Join or create play groups, track game history and manage your local Magic community.</p>
      </div>
      <div class="feature-card p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow">
        <div class="icon-container bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-center mb-2">Collection Tracking</h3>
        <p class="text-gray-600 text-center">Catalog and organize your card collection with our powerful collection management tools.</p>
      </div>
    </div>
  </div>
</div>

<div id="auth" class="auth-section py-16 bg-gradient-to-br from-indigo-100 to-purple-50">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12 text-indigo-900">Join the Community</h2>
    <div class="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
      <div class="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6 md:p-8">
        <Register />
      </div>
      <div class="w-full md:w-1/2 bg-white rounded-lg shadow-lg p-6 md:p-8">
        <Login />
      </div>
    </div>
  </div>
</div>

<style>
  .hero-section {
    background: linear-gradient(135deg, #eef2ff 0%, #e4e2fd 100%);
  }
  
  @media (min-width: 768px) {
    .feature-card {
      min-height: 280px;
    }
  }
</style>
