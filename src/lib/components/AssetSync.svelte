<script>
  import { createEventDispatcher } from 'svelte';
  import { getApiUrl } from '$lib/api';
  
  const dispatch = createEventDispatcher();
  
  export let asset = null;
  export let accessToken = '';
  
  let isSyncing = false;
  let syncStatus = '';
  let syncError = '';
  let lastSyncTime = null;

  async function syncAssetToZoho() {
    if (!asset || !accessToken) {
      syncError = 'Asset and access token are required for sync';
      return;
    }

    try {
      isSyncing = true;
      syncError = '';
      syncStatus = 'Syncing asset to Zoho CRM...';

      const response = await fetch(getApiUrl('/api/zoho/sync-asset'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: asset.id,
          accessToken: accessToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const result = await response.json();
      syncStatus = 'Asset synced successfully!';
      lastSyncTime = new Date();
      
      dispatch('synced', {
        asset: asset,
        result: result,
        timestamp: lastSyncTime
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        syncStatus = '';
      }, 3000);

    } catch (error) {
      syncError = 'Sync failed: ' + error.message;
      console.error('Asset sync error:', error);
      
      dispatch('syncError', {
        asset: asset,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      isSyncing = false;
    }
  }

  function clearMessages() {
    syncStatus = '';
    syncError = '';
  }

  // Auto-clear error after 5 seconds
  $: if (syncError) {
    setTimeout(() => {
      syncError = '';
    }, 5000);
  }
</script>

<div class="asset-sync">
  {#if syncError}
    <div class="sync-message error">
      <span class="message-icon">❌</span>
      <span class="message-text">{syncError}</span>
      <button on:click={clearMessages} class="close-btn">×</button>
    </div>
  {/if}

  {#if syncStatus}
    <div class="sync-message success">
      <span class="message-icon">✅</span>
      <span class="message-text">{syncStatus}</span>
      <button on:click={clearMessages} class="close-btn">×</button>
    </div>
  {/if}

  <div class="sync-controls">
    {#if asset}
      <div class="asset-info">
        <h4>🔄 Sync to Zoho CRM</h4>
        <p class="asset-details">
          <strong>{asset.name}</strong> ({asset.asset_tag})
          <br>
          <span class="asset-meta">{asset.category} • {asset.brand} {asset.model}</span>
        </p>
        {#if lastSyncTime}
          <p class="last-sync">
            Last synced: {lastSyncTime.toLocaleString()}
          </p>
        {/if}
      </div>

      <div class="sync-actions">
        <button 
          on:click={syncAssetToZoho} 
          class="sync-btn"
          disabled={isSyncing || !accessToken}
        >
          {#if isSyncing}
            <div class="spinner"></div>
            Syncing...
          {:else}
            <span class="sync-icon">🔄</span>
            Sync Asset
          {/if}
        </button>

        {#if !accessToken}
          <p class="auth-required">
            ⚠️ Zoho authentication required
          </p>
        {/if}
      </div>
    {:else}
      <div class="no-asset">
        <p>📄 No asset selected for sync</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .asset-sync {
    background: linear-gradient(135deg, #f8f6f0 0%, #e8e6e0 100%);
    border: 1px solid #d4af37;
    border-radius: 12px;
    padding: 20px;
    margin: 10px 0;
  }

  .sync-message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 15px;
    font-size: 14px;
  }

  .sync-message.success {
    background: #e8f5e8;
    border: 1px solid #4caf50;
    color: #2e7d32;
  }

  .sync-message.error {
    background: #fee;
    border: 1px solid #f44336;
    color: #c62828;
  }

  .message-icon {
    font-size: 16px;
  }

  .message-text {
    flex: 1;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    opacity: 0.7;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .sync-controls {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .asset-info {
    flex: 1;
  }

  .asset-info h4 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 16px;
  }

  .asset-details {
    margin: 0 0 10px 0;
    line-height: 1.5;
  }

  .asset-meta {
    color: #666;
    font-size: 13px;
  }

  .last-sync {
    margin: 0;
    color: #666;
    font-size: 12px;
    font-style: italic;
  }

  .sync-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .sync-btn {
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(212, 175, 55, 0.3);
    min-width: 120px;
    justify-content: center;
  }

  .sync-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(212, 175, 55, 0.4);
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .sync-icon {
    font-size: 16px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-required {
    margin: 0;
    font-size: 12px;
    color: #ff9800;
    text-align: center;
    font-style: italic;
  }

  .no-asset {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 20px;
  }

  @media (max-width: 600px) {
    .sync-controls {
      flex-direction: column;
      gap: 15px;
    }

    .sync-actions {
      align-self: stretch;
    }

    .sync-btn {
      width: 100%;
    }
  }
</style>
