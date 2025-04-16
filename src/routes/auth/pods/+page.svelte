<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchUserPods, fetchPodMembers, createPod, removeUserFromPod, updatePodName } from '$lib/client/api';
    import { user } from '$lib/stores/userStore';

    interface Pod {
        _id: string;
        name: string;
        userCount: number;
    }

    let pods: Pod[] = [];
    let currentUser: any;
    let newPodName = '';
    let renameMap: Record<string, string> = {};

    // Subscribe to user store
    user.subscribe(value => {
        currentUser = value;
    });

    onMount(async () => {
        await loadPods();
    });

    async function loadPods() {
        if (!currentUser?.id) return;

        const rawPods = await fetchUserPods(currentUser.id);
        pods = rawPods.map((pod: any) => ({
            _id: pod.id.toString(),
            name: pod.name,
            userCount: 0
        }));

        pods = await Promise.all(pods.map(async (pod) => {
            const users = await fetchPodMembers(pod._id);
            return { ...pod, userCount: users.length };
        }));
    }

    async function handleCreatePod() {
        if (!newPodName.trim()) return;
        await createPod(newPodName);
        newPodName = '';
        await loadPods();
    }

    async function leavePod(podId: string) {
        await removeUserFromPod(podId, currentUser.id);
        await loadPods();
    }

    async function renamePod(podId: string) {
        const name = renameMap[podId]?.trim();
        if (!name) return;
        await updatePodName(podId, name);
        await loadPods();
    }

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
        <!-- New Pod form -->
        <div class="mb-4">
            <input type="text" bind:value={newPodName} placeholder="New pod name" class="border p-2 rounded mr-2" />
            <button on:click={handleCreatePod} class="bg-green-600 text-white px-4 py-2 rounded">Create Pod</button>
        </div>

        <ul>
            {#each pods as pod}
                <li class="mb-2 flex items-center space-x-2">
                    <strong>{pod.name}</strong> ({pod.userCount} users)
                    <button on:click={() => leavePod(pod._id)} class="text-red-600">Leave</button>
                    <input type="text" placeholder="Rename" bind:value={renameMap[pod._id]} class="border p-1 rounded w-32" />
                    <button on:click={() => renamePod(pod._id)} class="text-blue-600">Rename</button>
                    <button on:click={() => showUsersInPod(pod._id)} class="text-gray-600">Show Users</button>
                </li>
            {/each}
        </ul>
    {/if}
</main>