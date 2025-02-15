<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchUserPods, fetchPodMembers } from '$lib/client/api'; // Ensure these are client-side imports

    interface Pod {
        _id: string;
        name: string;
        userCount: number;
    }

    let pods: Pod[] = [];
    let userId = 'currentUserId'; // Replace with actual user ID

    // Fetch user's pods
    onMount(async () => {
        const rawPods = await fetchUserPods(userId);
        pods = rawPods.map((pod: any) => ({
            _id: pod.id.toString(),
            name: pod.name,
            userCount: 0 // Initialize userCount to 0
        }));
        // Fetch the number of users in each pod
        pods = await Promise.all(pods.map(async (pod) => {
            const users = await fetchPodMembers(pod._id);
            return { ...pod, userCount: users.length };
        }));
    });

    async function showUsersInPod(podId: string) {
        let selectedPodUsers = await fetchPodMembers(podId);
        console.log(selectedPodUsers); // Handle the selected pod users as needed
    }
</script>

<main>
    <h1>Your Pods</h1>
    <ul>
        {#each pods as pod}
            <li>
                <strong>{pod.name}</strong> - {pod.userCount} users
                <button on:click={() => showUsersInPod(pod._id)}>Show Users</button>
            </li>
        {/each}
    </ul>
</main>