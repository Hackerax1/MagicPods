import { register } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function post(event: RequestEvent) {
    const { email, username, password } = await event.request.json();
    try {
        const user = await register(email, username, password);
        return {
            status: 200,
            body: user
        };
    } catch (error) {
        return {
            status: 500,
            body: { error: 'Failed to register user' }
        };
    }
}
