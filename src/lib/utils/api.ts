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

export async function removeUserFromPod(podId: string, userId: string) {
    const response = await fetch('/api/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeUserFromPod', podId, userId })
    });
    if (!response.ok) {
        throw new Error('Failed to remove user from pod');
    }
    return await response.json();
}

import { fetchCard as fetchCardFromScryfall } from '$lib/utils/scryfall';

export async function fetchCard(cardName: string) {
    const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardName })
    });
    if (!response.ok) {
        throw new Error('Failed to fetch card');
    }
    return await response.json();
}

export async function uploadCSV(csvFile: File) {
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    const response = await fetch('/api/collection', {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        throw new Error('Failed to upload CSV');
    }
    return await response.json();
}

export async function addCardToCollection(card: any) {
    const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card })
    });
    if (!response.ok) {
        throw new Error('Failed to add card to collection');
    }
    return await response.json();
}

export async function getAuthToken() {
    // This should return the JWT token from your auth store or local storage
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    try {
        const userData = JSON.parse(userDataStr);
        return userData.token;
    } catch {
        return null;
    }
}

export async function scanCard(imageFile: File) {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('http://localhost:5000/scan', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Authentication failed');
        }
        throw new Error('Failed to scan card');
    }

    const result = await response.json();
    
    // If a card was successfully scanned, add it to the collection
    if (result.text) {
        try {
            await addCardToCollection(result.text);
        } catch (error) {
            console.warn('Card scanned but failed to add to collection:', error);
        }
    }

    return result;
}

