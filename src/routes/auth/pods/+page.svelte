<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchUserPods, fetchPodMembers } from '$lib/client/api';
    import { user } from '$lib/stores/userStore';

    interface Pod {
        _id: string;
        name: string;
        userCount: number;
    }

    let pods: Pod[] = [];
    let currentUser: any;

    // Subscribe to user store
    user.subscribe(value => {
        currentUser = value;
    });

    // Fetch user's pods
    onMount(async () => {
        if (!currentUser?.id) return;
        
        const rawPods = await fetchUserPods(currentUser.id);
        pods = rawPods.map((pod: any) => ({
            _id: pod.id.toString(),
            name: pod.name,
            userCount: 0
        }));
        
        // Fetch the number of users in each pod
        pods = await Promise.all(pods.map(async (pod) => {
            const users = await fetchPodMembers(pod._id);
            return { ...pod, userCount: users.length };
        }));
    });

    async function showUsersInPod(podId: string) {
        let selectedPodUsers = await fetchPodMembers(podId);
        console.log(selectedPodUsers);
    }
</script>

<main>
    <h1>Your Pods</h1>
    {#if !currentUser?.id}
        <p>Please log in to view your pods</p>
    {:else if pods.length === 0}
        <p>You don't have any pods yet</p>
    {:else}
        <ul>
            {#each pods as pod}
                <li>
                    <strong>{pod.name}</strong> - {pod.userCount} users
                    <button on:click={() => showUsersInPod(pod._id)}>Show Users</button>
                </li>
            {/each}
        </ul>
    {/if}
</main>