<!-- A catch-all error page that also serves as our SPA fallback -->
<script lang="ts">
    import { page } from '$app/stores';
    import { base } from '$app/paths';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <div class="text-center max-w-lg">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
            {$page.status === 404 ? 'Page Not Found' : 'Unexpected Error'}
        </h1>
        <p class="text-gray-600 mb-8">
            {$page.error?.message || "We couldn't find the page you're looking for."}
        </p>
        <a
            href="{base}/"
            class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
            Return Home
        </a>
    </div>
</div>