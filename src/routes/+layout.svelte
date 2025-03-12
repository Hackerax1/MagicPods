<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/userStore';
	import type { User } from '$lib/stores/userStore';

	let { children } = $props();
	let isMenuOpen = $state(false);
	import { writable } from 'svelte/store';
	let currentUser = writable<User>(null);
	
	// Subscribe to the user store
	user.subscribe(value => {
		currentUser.set(value);
	});

	// Toggle mobile menu
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	onMount(async () => {
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
						<button 
							onclick={handleLogout}
							class="bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded-md transition">
							Logout
						</button>
					{:else}
						<a href="/" class="hover:text-indigo-200 transition">Home</a>
					{/if}
				</nav>
				
				<!-- Mobile Menu Button -->
				<button 
					id="nav-toggle"
					class="md:hidden text-white focus:outline-none" 
					onclick={(e) => { e.stopPropagation(); toggleMenu(); }}
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
							<button 
								onclick={handleLogout}
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
		{@render children()}
	</main>

	<footer class="bg-indigo-800 text-white py-6">
		<div class="container mx-auto px-4">
			<p class="text-center text-sm">
				© {new Date().getFullYear()} MTGSvelte. All rights reserved.
			</p>
		</div>
	</footer>
</div>
