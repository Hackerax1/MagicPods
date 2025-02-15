<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	onMount(() => {
		console.log('Layout mounted');
	});
</script>

<header>
  <h1>MTG Svelte App</h1>
</header>

<main>{@render children()}</main>

<footer>
  <p>&copy; 2025 MTG Svelte App</p>
</footer>
