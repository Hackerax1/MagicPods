import { fetchUserPods, fetchPodMembers } from '$lib/utils/api';

export async function load({ url }) {
    const userId = url.searchParams.get('userId');
    const podId = url.searchParams.get('podId');

    if (!userId || !podId) {
        return {
            status: 400,
            body: { error: 'Missing userId or podId' }
        };
    }

    try {
        const [userPods, podMembers] = await Promise.all([
            fetchUserPods(userId),
            fetchPodMembers(podId)
        ]);

        return {
            status: 200,
            body: { userPods, podMembers }
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: 'Failed to fetch data' }
        };
    }
}
