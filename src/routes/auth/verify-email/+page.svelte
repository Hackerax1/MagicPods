<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Alert from '$lib/components/ui/Alert.svelte';

    let status: 'loading' | 'success' | 'error' = 'loading';
    let message = '';

    onMount(async () => {
        try {
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                status = 'error';
                message = 'Verification token is missing';
                return;
            }

            const response = await fetch(`/auth/verify-email?token=${token}`);
            const data = await response.json();

            if (data.success) {
                status = 'success';
                message = data.message;
                // Redirect after 3 seconds
                setTimeout(() => {
                    goto(data.redirectTo);
                }, 3000);
            } else {
                status = 'error';
                message = data.error;
            }
        } catch (error) {
            status = 'error';
            message = 'Failed to verify email';
        }
    });
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md space-y-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold text-gray-900">Email Verification</h2>
            {#if status === 'loading'}
                <p class="mt-2 text-gray-600">Verifying your email...</p>
            {:else}
                <Alert type={status === 'success' ? 'success' : 'error'}>
                    {message}
                </Alert>
                {#if status === 'success'}
                    <p class="mt-4 text-sm text-gray-600">
                        Redirecting you to the login page...
                    </p>
                {/if}
            {/if}
        </div>
    </div>
</main>