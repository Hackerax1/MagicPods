<!-- CardScanner.svelte -->
<script lang="ts">
    import { scanCard } from '$lib/utils/api';
    import { userStore } from '$lib/stores/userStore';

    let selectedImage: File | null = null;
    let scanning = false;
    let error = '';
    let scannedText = '';

    async function handleImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedImage = input.files[0];
        }
    }

    async function handleScan() {
        if (!selectedImage) {
            error = 'Please select an image first';
            return;
        }

        error = '';
        scanning = true;
        try {
            const result = await scanCard(selectedImage);
            scannedText = result.text;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to scan card';
        } finally {
            scanning = false;
        }
    }
</script>

<div class="card-scanner">
    <h2>Card Scanner</h2>
    
    <div class="scanner-input">
        <input 
            type="file" 
            accept="image/*" 
            on:change={handleImageSelect} 
            class="file-input"
        />
        
        <button 
            on:click={handleScan} 
            disabled={!selectedImage || scanning}
            class="scan-button"
        >
            {scanning ? 'Scanning...' : 'Scan Card'}
        </button>
    </div>

    {#if error}
        <p class="error">{error}</p>
    {/if}

    {#if scannedText}
        <div class="scan-result">
            <h3>Scanned Text:</h3>
            <p>{scannedText}</p>
        </div>
    {/if}
</div>

<style>
    .card-scanner {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-width: 600px;
        margin: 0 auto;
    }

    .scanner-input {
        margin: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .file-input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .scan-button {
        padding: 0.5rem 1rem;
        background-color: #4a9eff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .scan-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .error {
        color: red;
        margin: 1rem 0;
    }

    .scan-result {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 4px;
    }
</style>