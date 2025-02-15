import { getUserPods, getPodMembers, loginUser } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function get(event: RequestEvent) {
    const { url } = event;
    const pathname = url.pathname;

    switch (pathname) {
        case '/api/userPods':
            return handleUserPods(event);
        case '/api/podMembers':
            return handlePodMembers(event);
        default:
            return {
                status: 404,
                body: { error: 'Not found' }
            };
    }
}

export async function post(event: RequestEvent) {
    const { url } = event;
    const pathname = url.pathname;

    switch (pathname) {
        case '/api/register':
            return await import('./register').then(module => module.post(event));
        case '/api/login':
            return handleLogin(event);
        default:
            return {
                status: 404,
                body: { error: 'Not found' }
            };
    }
}

async function handleUserPods({ url }: RequestEvent) {
    const userId = url.searchParams.get('userId');
    if (!userId) {
        return {
            status: 400,
            body: { error: 'Missing userId' }
        };
    }

    try {
        const pods = await getUserPods(userId);
        return {
            status: 200,
            body: pods
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: 'Failed to fetch user pods' }
        };
    }
}

async function handlePodMembers({ url }: RequestEvent) {
    const podId = url.searchParams.get('podId');
    if (!podId) {
        return {
            status: 400,
            body: { error: 'Missing podId' }
        };
    }

    try {
        const members = await getPodMembers(podId);
        return {
            status: 200,
            body: members
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: 'Failed to fetch pod members' }
        };
    }
}

async function handleLogin(event: RequestEvent) {
    const { identifier, password } = await event.request.json();
    try {
        const user = await loginUser(identifier, password);
        return {
            status: 200,
            body: user
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: 'Failed to login' }
        };
    }
}
