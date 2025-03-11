<!-- CardScanner.svelte -->
<script lang="ts">
    import { scanCard } from '$lib/utils/api';
    import { userStore } from '$lib/stores/userStore';
    import { onDestroy, onMount } from 'svelte';

    let selectedImage: File | null = null;
    let scanning = false;
    let error = '';
    let scannedText = '';
    
    // Live scanning properties
    let isLiveMode = false;
    let liveScanning = false;
    let videoEl: HTMLVideoElement;
    let displayCanvas: HTMLCanvasElement;
    let scanInterval: number;
    let frameImageUrl: string = '';
    let liveScannedText = '';
    
    // Base URL for card scanner API
    const API_BASE_URL = '/api/scanner'; // Adjust based on your API setup
    
    // Auth token for API calls
    let authToken = '';
    
    onMount(() => {
        const unsubscribe = userStore.subscribe(user => {
            if (user && user.token) {
                authToken = user.token;
            }
        });
        
        return () => unsubscribe();
    });

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
    
    // Live scanning functions
    async function startLiveScanning() {
        if (!authToken) {
            error = 'Authentication required for live scanning';
            return;
        }
        
        error = '';
        liveScanning = true;
        
        try {
            // Start live scanning session on the server
            const response = await fetch(`${API_BASE_URL}/scan/live/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to start live scanning session');
            }
            
            // Start polling for frames
            pollForFrames();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to start live scanning';
            liveScanning = false;
        }
    }
    
    async function stopLiveScanning() {
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = undefined;
        }
        
        if (liveScanning) {
            try {
                await fetch(`${API_BASE_URL}/scan/live/stop`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (e) {
                console.error('Error stopping live scanning:', e);
            }
        }
        
        liveScanning = false;
        frameImageUrl = '';
    }
    
    function pollForFrames() {
        if (scanInterval) {
            clearInterval(scanInterval);
        }
        
        scanInterval = setInterval(async () => {
            if (!liveScanning) {
                clearInterval(scanInterval);
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/scan/live/frame`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to get frame');
                }
                
                const data = await response.json();
                
                if (data.frame) {
                    frameImageUrl = `data:image/jpeg;base64,${data.frame}`;
                }
                
                if (data.result) {
                    liveScannedText = data.result;
                }
            } catch (e) {
                console.error('Error fetching frame:', e);
            }
        }, 200); // Poll every 200ms
    }
    
    function toggleScanMode() {
        if (liveScanning) {
            stopLiveScanning();
        }
        
        isLiveMode = !isLiveMode;
        error = '';
        scannedText = '';
        liveScannedText = '';
    }
    
    // Cleanup on component destruction
    onDestroy(() => {
        if (scanInterval) {
            clearInterval(scanInterval);
        }
        
        stopLiveScanning();
    });
</script>

<div class="card-scanner">
    <h2>Card Scanner</h2>
    
    <div class="scan-mode-toggle">
        <button 
            class={isLiveMode ? "mode-button" : "mode-button active"}
            on:click={() => !liveScanning && toggleScanMode()}
            disabled={liveScanning}
        >
            Image Upload
        </button>
        <button 
            class={isLiveMode ? "mode-button active" : "mode-button"}
            on:click={() => !scanning && toggleScanMode()}
            disabled={scanning}
        >
            Live Camera
        </button>
    </div>
    
    {#if !isLiveMode}
        <!-- Image Upload Scanning Mode -->
        <div class="scanner-input">
            <input 
                type="file" 
                accept="image/*" 
                on:change={handleImageSelect} 
                class="file-input"
                disabled={scanning}
            />
            
            <button 
                on:click={handleScan} 
                disabled={!selectedImage || scanning}
                class="scan-button"
            >
                {scanning ? 'Scanning...' : 'Scan Card'}
            </button>
        </div>
        
        {#if scannedText}
            <div class="scan-result">
                <h3>Scanned Text:</h3>
                <p>{scannedText}</p>
            </div>
        {/if}
    {:else}
        <!-- Live Camera Scanning Mode -->
        <div class="live-scanner">
            {#if !liveScanning}
                <button 
                    on:click={startLiveScanning}
                    class="scan-button live-button"
                >
                    Start Live Scanning
                </button>
            {:else}
                <div class="live-preview">
                    {#if frameImageUrl}
                        <img src={frameImageUrl} alt="Live camera feed" />
                    {:else}
                        <div class="loading-preview">Loading camera...</div>
                    {/if}
                </div>
                
                <button 
                    on:click={stopLiveScanning}
                    class="scan-button stop-button"
                >
                    Stop Scanning
                </button>
                
                {#if liveScannedText}
                    <div class="scan-result live-result">
                        <h3>Detected Card Text:</h3>
                        <p>{liveScannedText}</p>
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
    
    {#if error}
        <p class="error">{error}</p>
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
    
    .live-button {
        background-color: #2a6e9e;
    }
    
    .stop-button {
        background-color: #e74c3c;
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
    
    .live-result {
        background-color: #e6f7ff;
    }
    
    .scan-mode-toggle {
        display: flex;
        margin-bottom: 1rem;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .mode-button {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ccc;
        background-color: #f0f0f0;
        cursor: pointer;
    }
    
    .mode-button.active {
        background-color: #4a9eff;
        color: white;
        border-color: #4a9eff;
    }
    
    .mode-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }
    
    .live-preview {
        width: 100%;
        max-height: 300px;
        border: 1px solid #ccc;
        border-radius: 4px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
        overflow: hidden;
    }
    
    .live-preview img {
        width: 100%;
        height: auto;
        object-fit: contain;
    }
    
    .loading-preview {
        padding: 2rem;
        color: #666;
    }
</style>