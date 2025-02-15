<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fetchPodDetails, addUserToPod } from '$lib/utils/api';

  let podId: string;
  let podDetails: any = {};
  let newUser = '';

  $: podId = $page.params.id;

  onMount(async () => {
    podDetails = await fetchPodDetails(podId);
  });

  async function handleAddUser() {
    try {
      await addUserToPod(podId, newUser);
      podDetails.users.push({ id: newUser, name: newUser }); // Update the local state
      newUser = '';
    } catch (error) {
      console.error('Failed to add user to pod:', error);
    }
  }
</script>

<main>
  <h1>{podDetails.name}</h1>
  <h2>Users in this Pod</h2>
  <ul>
    {#each podDetails.users as user}
      <li>{user.name}</li>
    {/each}
  </ul>

  <form on:submit|preventDefault={handleAddUser}>
    <input type="text" bind:value={newUser} placeholder="Enter username to add" />
    <button type="submit">Add User</button>
  </form>
</main>

<style>
  main {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  form {
    margin-top: 1rem;
  }

  input {
    padding: 0.5rem;
    margin-right: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
  }
</style>