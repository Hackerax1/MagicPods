<script lang="ts">
    import { scanCard, startLiveScanning, getLiveFrame, stopLiveScanning } from '$lib/utils/api';
    import userStore from '$lib/stores/userStore';
    import type { User } from '$lib/stores/userStore';
    import { onDestroy } from 'svelte';
    import Alert from '$lib/components/ui/Alert.svelte';

    let selectedImage: File | null = null;
    let scanning = false;
    let error = '';
    let scannedText = '';
    let alert: { type: 'success' | 'error'; message: string } | null = null;
    
    // Live scanning properties
    let isLiveMode = false;
    let liveScanning = false;
    let scanInterval: ReturnType<typeof setInterval> | undefined;
    let frameImageUrl: string = '';
    let liveScannedText = '';
    let retryCount = 0;
    const MAX_FRAME_RETRIES = 3;
    
    // Authentication
    let authToken = '';
    const unsubscribe = userStore.subscribe((user: User | null) => {
        if (user?.token) {
            authToken = user.token;
        }
    });

    async function handleImageSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedImage = input.files[0];
            error = '';
            alert = null;
        }
    }

    async function handleScan() {
        if (!selectedImage) {
            error = 'Please select an image first';
            return;
        }

        error = '';
        alert = null;
        scanning = true;
        
        try {
            const result = await scanCard(selectedImage);
            scannedText = result.text;
            if (result.text) {
                alert = {
                    type: 'success',
                    message: 'Card successfully scanned and added to collection!'
                };
            }
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Failed to scan card';
            error = errorMsg;
            alert = {
                type: 'error',
                message: errorMsg
            };
        } finally {
            scanning = false;
        }
    }
    
    async function startScanning() {
        if (!authToken) {
            error = 'Authentication required for live scanning';
            return;
        }
        
        error = '';
        alert = null;
        liveScanning = true;
        retryCount = 0;
        
        try {
            await startLiveScanning();
            pollForFrames();
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Failed to start live scanning';
            error = errorMsg;
            liveScanning = false;
        }
    }
    
    async function pollForFrames() {
        if (scanInterval) {
            clearInterval(scanInterval);
        }
        
        scanInterval = setInterval(async () => {
            if (!liveScanning) {
                clearInterval(scanInterval);
                return;
            }
            
            try {
                const data = await getLiveFrame();
                if (!data) {
                    retryCount++;
                    if (retryCount >= MAX_FRAME_RETRIES) {
                        throw new Error('Failed to get camera feed');
                    }
                    return;
                }
                
                retryCount = 0;
                if (data.frame) {
                    frameImageUrl = `data:image/jpeg;base64,${data.frame}`;
                }
                
                if (data.result) {
                    liveScannedText = data.result;
                    alert = {
                        type: 'success',
                        message: 'Card detected!'
                    };
                }
            } catch (e) {
                console.error('Error fetching frame:', e);
                if (retryCount >= MAX_FRAME_RETRIES) {
                    await handleStopScanning();
                    error = 'Lost connection to camera';
                }
            }
        }, 200);
    }
    
    async function handleStopScanning() {
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = undefined;
        }
        
        if (liveScanning) {
            await stopLiveScanning();
            liveScanning = false;
            frameImageUrl = '';
        }
    }
    
    function toggleScanMode() {
        if (liveScanning) {
            handleStopScanning();
        }
        
        isLiveMode = !isLiveMode;
        error = '';
        alert = null;
        scannedText = '';
        liveScannedText = '';
    }
    
    // Cleanup
    onDestroy(() => {
        unsubscribe();
        handleStopScanning();
    });
</script>

<div class="card-scanner">
    <h2 class="text-2xl font-bold mb-4">Card Scanner</h2>
    
    {#if alert}
        <div class="mb-4">
            <Alert type={alert.type} dismissable={true} on:close={() => alert = null}>
                {alert.message}
            </Alert>
        </div>
    {/if}
    
    <div class="scan-mode-toggle">
        <button 
            class={isLiveMode ? "mode-button" : "mode-button active"}
            on:click={() => !liveScanning && toggleScanMode()}
            disabled={liveScanning}
            aria-pressed={!isLiveMode}
        >
            Image Upload
        </button>
        <button 
            class={isLiveMode ? "mode-button active" : "mode-button"}
            on:click={() => !scanning && toggleScanMode()}
            disabled={scanning}
            aria-pressed={isLiveMode}
        >
            Live Camera
        </button>
    </div>
    
    {#if !isLiveMode}
        <!-- Image Upload Mode -->
        <div class="scanner-input">
            <input 
                type="file" 
                accept="image/*" 
                on:change={handleImageSelect} 
                class="file-input"
                disabled={scanning}
                aria-label="Choose card image"
            />
            
            <button 
                on:click={handleScan} 
                disabled={!selectedImage || scanning}
                class="scan-button"
                aria-busy={scanning}
            >
                {scanning ? 'Scanning...' : 'Scan Card'}
            </button>
        </div>
        
        {#if scannedText}
            <div class="scan-result" role="status">
                <h3 class="text-lg font-semibold">Scanned Text:</h3>
                <p class="mt-2">{scannedText}</p>
            </div>
        {/if}
    {:else}
        <!-- Live Camera Mode -->
        <div class="live-scanner">
            {#if !liveScanning}
                <button 
                    on:click={startScanning}
                    class="scan-button live-button"
                >
                    Start Live Scanning
                </button>
            {:else}
                <div class="live-preview" role="img" aria-label="Live camera feed">
                    {#if frameImageUrl}
                        <img src={frameImageUrl} alt="Live camera feed" />
                    {:else}
                        <div class="loading-preview">Loading camera...</div>
                    {/if}
                </div>
                
                <button 
                    on:click={handleStopScanning}
                    class="scan-button stop-button"
                >
                    Stop Scanning
                </button>
                
                {#if liveScannedText}
                    <div class="scan-result live-result" role="status">
                        <h3 class="text-lg font-semibold">Detected Card:</h3>
                        <p class="mt-2">{liveScannedText}</p>
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
    
    {#if error}
        <p class="error" role="alert">{error}</p>
    {/if}
</div>

<style>
    .card-scanner {
        @apply p-4 border border-gray-200 rounded-lg max-w-2xl mx-auto bg-white shadow-sm;
    }

    .scanner-input {
        @apply space-y-4 my-4;
    }

    .file-input {
        @apply w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500;
    }

    .scan-button {
        @apply w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
    }
    
    .live-button {
        @apply bg-green-600 hover:bg-green-700 focus:ring-green-500;
    }
    
    .stop-button {
        @apply bg-red-600 hover:bg-red-700 focus:ring-red-500;
    }

    .scan-mode-toggle {
        @apply flex rounded-md overflow-hidden mb-4;
    }
    
    .mode-button {
        @apply flex-1 px-4 py-2 text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
    }
    
    .mode-button.active {
        @apply bg-indigo-600 text-white border-indigo-600;
    }

    .live-preview {
        @apply w-full max-h-[400px] border border-gray-200 rounded-lg overflow-hidden mb-4 flex items-center justify-center bg-gray-50;
    }
    
    .live-preview img {
        @apply w-full h-full object-contain;
    }
    
    .loading-preview {
        @apply p-8 text-gray-500;
    }

    .error {
        @apply mt-4 text-red-600 text-sm;
    }

    .scan-result {
        @apply mt-4 p-4 bg-gray-50 rounded-lg;
    }
    
    .live-result {
        @apply bg-green-50;
    }
</style>