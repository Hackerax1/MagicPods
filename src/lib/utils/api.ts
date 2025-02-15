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

export async function fetchPodDetails(podId: string) {
    const response = await fetch(`/api/podDetails?podId=${podId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch pod details');
    }
    return await response.json();
}

export async function addUserToPod(podId: string, userId: string) {
    const response = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addUserToPod', podId, newUserId: userId })
    });
    if (!response.ok) {
        throw new Error('Failed to add user to pod');
    }
    return await response.json();
}