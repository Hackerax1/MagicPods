import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '$lib/server/utils/apiResponse';

export async function GET({ url }: RequestEvent) {
    try {
        const token = url.searchParams.get('token');
        if (!token) {
            return errorResponse('Verification token is required', 400);
        }

        // Find user with this verification token
        const users = await db
            .select()
            .from(user)
            .where(eq(user.verificationToken, token));

        if (users.length === 0) {
            return errorResponse('Invalid verification token', 400);
        }

        const foundUser = users[0];

        // Update user to mark email as verified
        await db
            .update(user)
            .set({ 
                emailVerified: true,
                verificationToken: null 
            })
            .where(eq(user.id, foundUser.id));

        return successResponse({ 
            message: 'Email verified successfully',
            redirectTo: '/auth' 
        });
    } catch (error) {
        return errorResponse('Failed to verify email', 500);
    }
}