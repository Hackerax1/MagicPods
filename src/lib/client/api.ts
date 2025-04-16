import { base } from '$app/paths';

export async function getDecks() {
	const response = await fetch(`${base}/api/deck`);
	if (!response.ok) {
		throw new Error('Failed to fetch decks');
	}
	return response.json();
}

export async function fetchUserPods(userId: string) {
	const response = await fetch(`${base}/api/pods/${userId}`);
	if (!response.ok) {
		throw new Error('Failed to fetch user pods');
	}
	return response.json();
}

export async function fetchPodMembers(podId: string) {
	const response = await fetch(`${base}/api/pods/${podId}/members`);
	if (!response.ok) {
		throw new Error('Failed to fetch pod members');
	}
	return response.json();
}

export async function createPod(podName: string) {
  const response = await fetch(`${base}/api/pods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createPod', podName })
  });
  if (!response.ok) throw new Error('Failed to create pod');
  return response.json();
}

export async function addUserToPod(podId: string, userId: string) {
  const response = await fetch(`${base}/api/pods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addUserToPod', podId, newUserId: userId })
  });
  if (!response.ok) throw new Error('Failed to add user to pod');
  return response.json();
}

export async function removeUserFromPod(podId: string, userId: string) {
  const response = await fetch(`${base}/api/pods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'removeUserFromPod', podId, userId })
  });
  if (!response.ok) throw new Error('Failed to remove user from pod');
  return response.json();
}

export async function updatePodName(podId: string, name: string) {
  const response = await fetch(`${base}/api/pods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updatePodName', podId, podName: name })
  });
  if (!response.ok) throw new Error('Failed to rename pod');
  return response.json();
}