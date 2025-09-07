<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { getApiUrl } from '$lib/api';
  
  const dispatch = createEventDispatcher();
  
  let isAuthenticated = false;
  let isLoading = false;
  let accessToken = '';
  let refreshToken = '';
  let tokenExpiry = null;
  let error = '';

  // Load tokens from localStorage on mount
  onMount(() => {
    if (browser) {
      loadTokensFromStorage();
      // Check for OAuth callback code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        exchangeCodeForToken(code);
      }
    }
  });

  function loadTokensFromStorage() {
    try {
      const storedTokens = localStorage.getItem('zoho_tokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        accessToken = tokens.access_token || '';
        refreshToken = tokens.refresh_token || '';
        tokenExpiry = tokens.expires_at ? new Date(tokens.expires_at) : null;
        
        // Check if token is still valid
        if (tokenExpiry && new Date() < tokenExpiry) {
          isAuthenticated = true;
          dispatch('authenticated', { accessToken, refreshToken });
        } else if (refreshToken) {
          refreshAccessToken();
        }
      }
    } catch (err) {
      console.error('Error loading tokens from storage:', err);
      clearTokens();
    }
  }

  function saveTokensToStorage(tokens) {
    try {
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        expires_in: tokens.expires_in
      };
      localStorage.setItem('zoho_tokens', JSON.stringify(tokenData));
      
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token;
      tokenExpiry = expiresAt;
      isAuthenticated = true;
      
      dispatch('authenticated', { accessToken, refreshToken });
    } catch (err) {
      console.error('Error saving tokens to storage:', err);
    }
  }

  function clearTokens() {
    if (browser) {
      localStorage.removeItem('zoho_tokens');
    }
    accessToken = '';
    refreshToken = '';
    tokenExpiry = null;
    isAuthenticated = false;
    dispatch('unauthenticated');
  }

  async function initiateOAuth() {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch(getApiUrl('/api/oauth/authorize'));
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      error = 'Failed to initiate OAuth: ' + err.message;
      console.error('OAuth initiation error:', err);
    } finally {
      isLoading = false;
    }
  }

  async function exchangeCodeForToken(code) {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch(getApiUrl('/api/oauth/token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const tokens = await response.json();
      saveTokensToStorage(tokens);
      
      // Clean up URL
      if (browser) {
        const url = new URL(window.location);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch (err) {
      error = 'Authentication failed: ' + err.message;
      console.error('Token exchange error:', err);
    } finally {
      isLoading = false;
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      clearTokens();
      return;
    }

    try {
      isLoading = true;
      error = '';
      
      const response = await fetch(getApiUrl('/api/oauth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token refresh failed');
      }

      const tokens = await response.json();
      saveTokensToStorage(tokens);
    } catch (err) {
      error = 'Token refresh failed: ' + err.message;
      console.error('Token refresh error:', err);
      clearTokens();
    } finally {
      isLoading = false;
    }
  }

  function logout() {
    clearTokens();
  }

  // Auto-refresh token before expiry
  $: if (tokenExpiry && isAuthenticated) {
    const timeUntilExpiry = tokenExpiry.getTime() - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 300000, 60000); // Refresh 5 min before expiry, but at least in 1 min
    
    if (refreshTime > 0) {
      setTimeout(() => {
        if (isAuthenticated && refreshToken) {
          refreshAccessToken();
        }
      }, refreshTime);
    }
  }

  // Export functions for parent components
  export function getAccessToken() {
    return accessToken;
  }

  export function isTokenValid() {
    return isAuthenticated && tokenExpiry && new Date() < tokenExpiry;
  }
</script>

<div class="zoho-oauth">
  {#if error}
    <div class="error-message">
      <span class="error-icon">⚠️</span>
      {error}
      <button on:click={() => error = ''} class="close-error">×</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Authenticating with Zoho...</span>
    </div>
  {:else if isAuthenticated}
    <div class="authenticated">
      <div class="auth-status">
        <span class="status-icon">✅</span>
        <span>Connected to Zoho CRM</span>
        <div class="token-info">
          <small>
            Expires: {tokenExpiry ? tokenExpiry.toLocaleString() : 'Unknown'}
          </small>
        </div>
      </div>
      <div class="auth-actions">
        <button on:click={refreshAccessToken} class="refresh-btn" disabled={isLoading}>
          🔄 Refresh Token
        </button>
        <button on:click={logout} class="logout-btn">
          🚪 Disconnect
        </button>
      </div>
    </div>
  {:else}
    <div class="unauthenticated">
      <div class="auth-prompt">
        <h3>🔗 Connect to Zoho CRM</h3>
        <p>Connect your Zoho CRM account to sync assets and enable advanced features.</p>
        <button on:click={initiateOAuth} class="connect-btn" disabled={isLoading}>
          <span class="zoho-logo">Z</span>
          Connect with Zoho
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .zoho-oauth {
    background: linear-gradient(135deg, #f8f6f0 0%, #e8e6e0 100%);
    border: 1px solid #d4af37;
    border-radius: 12px;
    padding: 20px;
    margin: 10px 0;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #c33;
  }

  .error-icon {
    font-size: 18px;
  }

  .close-error {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #c33;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 15px;
    justify-content: center;
    padding: 20px;
    color: #666;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #d4af37;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .authenticated {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .auth-status {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .status-icon {
    margin-right: 8px;
  }

  .token-info {
    color: #666;
    font-size: 12px;
  }

  .auth-actions {
    display: flex;
    gap: 10px;
  }

  .refresh-btn, .logout-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .refresh-btn {
    background: #d4af37;
    color: white;
  }

  .refresh-btn:hover {
    background: #b8941f;
  }

  .logout-btn {
    background: #fff;
    color: #666;
    border: 1px solid #ddd;
  }

  .logout-btn:hover {
    background: #f5f5f5;
  }

  .unauthenticated {
    text-align: center;
  }

  .auth-prompt h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 18px;
  }

  .auth-prompt p {
    margin: 0 0 20px 0;
    color: #666;
    font-size: 14px;
  }

  .connect-btn {
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 auto;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  }

  .connect-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  }

  .connect-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .zoho-logo {
    background: white;
    color: #d4af37;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
  }

  @media (max-width: 600px) {
    .authenticated {
      flex-direction: column;
      align-items: stretch;
      gap: 15px;
    }

    .auth-actions {
      justify-content: center;
    }
  }
</style>
