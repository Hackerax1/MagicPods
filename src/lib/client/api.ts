export async function getDecks() {
	const response = await fetch('/api/deck');
	if (!response.ok) {
		throw new Error('Failed to fetch decks');
	}
	return response.json();
}

export async function fetchUserPods(userId: string) {
	const response = await fetch(`/api/pods/${userId}`);
	if (!response.ok) {
		throw new Error('Failed to fetch user pods');
	}
	return response.json();
}

export async function fetchPodMembers(podId: string) {
	const response = await fetch(`/api/pods/${podId}/members`);
	if (!response.ok) {
		throw new Error('Failed to fetch pod members');
	}
	return response.json();
}