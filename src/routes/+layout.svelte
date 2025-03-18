<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/userStore';
	import type { User } from '$lib/stores/userStore';
	import { initializeAppShortcuts } from '$lib/utils/keyboard';
	import { initOfflineSupport } from '$lib/utils/offline';
	import OfflineIndicator from '$lib/components/ui/OfflineIndicator.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	let isMenuOpen = false;
	let currentUser: User = null;
	
	// Subscribe to the user store
	user.subscribe((value: User | null) => {
		currentUser = value;
	});

	// Toggle mobile menu
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	onMount(async () => {
		// Initialize keyboard shortcuts
		initializeAppShortcuts();
		
		// Initialize offline support
		initOfflineSupport();
		
		// Check auth status on mount
		try {
			const response = await fetch('/api/auth');
			const data = await response.json();
			if (data.user) {
				user.set(data.user);
			}
		} catch (error) {
			console.error('Error checking auth status:', error);
		}

		// Close menu when clicking outside
		document.addEventListener('click', (event) => {
			const navMenu = document.getElementById('nav-menu');
			const navToggle = document.getElementById('nav-toggle');
			
			if (navMenu && isMenuOpen && 
				!navMenu.contains(event.target as Node) && 
				!navToggle?.contains(event.target as Node)) {
				isMenuOpen = false;
			}
		});
		
		// Listen for notifications from the offline system
		window.addEventListener('app:notification', (event: Event) => {
			const customEvent = event as CustomEvent;
			if (customEvent.detail) {
				// If you have a toast system, you could use it here
				console.log(`Notification: ${customEvent.detail.message}`);
			}
		});
	});

	async function handleLogout() {
		try {
			await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'logout' })
			});
			
			user.set(null);
			window.location.href = '/';
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 text-gray-800">
	<header class="bg-indigo-700 text-white shadow-lg">
		<div class="container mx-auto px-4">
			<div class="flex justify-between items-center py-4">
				<!-- Logo/Title -->
				<div class="flex items-center space-x-2">
					<img src="/favicon.png" alt="MTG Logo" class="w-8 h-8">
					<a href="/" class="text-xl font-bold">MTGSvelte</a>
				</div>
				
				<!-- Desktop Navigation -->
				<nav class="hidden md:flex items-center space-x-6">
					{#if currentUser}
						<a href="/auth" class="hover:text-indigo-200 transition">Dashboard</a>
						<a href="/auth/decks" class="hover:text-indigo-200 transition">Decks</a>
						<a href="/auth/collection" class="hover:text-indigo-200 transition">Collection</a>
						<a href="/auth/pods" class="hover:text-indigo-200 transition">Pods</a>
						<div class="relative group">
							<button class="flex items-center hover:text-indigo-200 transition">
								<span class="mr-1">{currentUser.username}</span>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							<div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
								<div class="py-1">
									<button 
										on:click={handleLogout}
										class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-100">
										Logout
									</button>
									<hr class="my-1">
									<div class="block px-4 py-2 text-xs text-gray-500">
										<p>Press <kbd class="px-1 py-0.5 bg-gray-100 border rounded">?</kbd> for shortcuts</p>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<a href="/" class="hover:text-indigo-200 transition">Home</a>
					{/if}
				</nav>
				
				<!-- Mobile Menu Button -->
				<button 
					id="nav-toggle"
					class="md:hidden text-white focus:outline-none" 
					on:click={(e) => { e.stopPropagation(); toggleMenu(); }}
					aria-label="Toggle menu">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
						{#if isMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
			
			<!-- Mobile Navigation -->
			{#if isMenuOpen}
				<div id="nav-menu" class="md:hidden pb-4">
					<div class="flex flex-col space-y-3">
						{#if currentUser}
							<a href="/auth" class="hover:bg-indigo-800 px-3 py-2 rounded transition">Dashboard</a>
							<a href="/auth/decks" class="hover:bg-indigo-800 px-3 py-2 rounded transition">Decks</a>
							<a href="/auth/collection" class="hover:bg-indigo-800 px-3 py-2 rounded transition">Collection</a>
							<a href="/auth/pods" class="hover:bg-indigo-800 px-3 py-2 rounded transition">Pods</a>
							<div class="px-3 py-2 text-xs">
								<p>Press <kbd class="px-1 py-0.5 bg-indigo-600 border border-indigo-500 rounded">?</kbd> for shortcuts</p>
							</div>
							<button 
								on:click={handleLogout}
								class="text-left bg-indigo-800 hover:bg-indigo-900 px-3 py-2 rounded transition">
								Logout
							</button>
						{:else}
							<a href="/" class="hover:bg-indigo-800 px-3 py-2 rounded transition">Home</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</header>

	<main class="flex-grow container mx-auto px-4 py-8">
		<slot />
	</main>

	<footer class="bg-indigo-800 text-white py-6">
		<div class="container mx-auto px-4">
			<div class="flex flex-col md:flex-row justify-between items-center">
				<p class="text-sm mb-4 md:mb-0">
					© {new Date().getFullYear()} MTGSvelte. All rights reserved.
				</p>
				<div class="text-xs flex items-center">
					<span class="mr-2">Keyboard shortcuts:</span>
					<kbd class="px-1 py-0.5 bg-indigo-700 border border-indigo-600 rounded mr-1">?</kbd>
					<span class="opacity-75">Help</span>
				</div>
			</div>
		</div>
	</footer>
	
	<!-- Offline indicator -->
	<OfflineIndicator />
	
	<!-- Toast container for notifications -->
	<ToastContainer />
</div>

<style>
	kbd {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
	}
</style>
