export async function fetchUserPods(userId: string) {
    const response = await fetch(`/api/userPods?userId=${userId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch user pods');
    }
    return await response.json();
}

export async function fetchPodMembers(podId: string) {
    const response = await fetch(`/api/podMembers?podId=${podId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch pod members');
    }
    return await response.json();
}
