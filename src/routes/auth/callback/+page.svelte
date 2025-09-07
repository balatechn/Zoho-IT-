<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  let processing = true;
  let error = '';
  let success = false;
  let debugInfo = '';

  onMount(async () => {
    if (!browser) return;
    
    try {
      // Debug: Log the current URL and parameters
      console.log('Current URL:', window.location.href);
      console.log('Search params:', window.location.search);
      
      // Get the authorization code from URL - try multiple methods
      const urlParams = new URLSearchParams(window.location.search);
      let code = urlParams.get('code');
      const errorCode = urlParams.get('error');
      
      // Debug info
      debugInfo = `URL: ${window.location.href}\nCode: ${code}\nError: ${errorCode}`;
      console.log('Debug info:', debugInfo);
      
      if (errorCode) {
        throw new Error('OAuth Error: ' + errorCode);
      }
      
      if (!code) {
        // Try to get code from hash as fallback
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const hashCode = hashParams.get('code');
        
        if (hashCode) {
          console.log('Found code in hash:', hashCode);
          code = hashCode;
        } else {
          throw new Error('No authorization code received. URL: ' + window.location.href);
        }
      }

      console.log('Authorization code found:', code);

      // Exchange code for tokens
      const response = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      console.log('Token exchange response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange error:', errorData);
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const tokens = await response.json();
      console.log('Tokens received:', Object.keys(tokens));
      
      // Store tokens in localStorage
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        expires_in: tokens.expires_in
      };
      localStorage.setItem('zoho_tokens', JSON.stringify(tokenData));
      
      success = true;
      success = true;
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        goto('/');
      }, 2000);
      
    } catch (err) {
      console.error('OAuth callback error:', err);
      error = err.message;
    } finally {
      processing = false;
    }
  });
</script>

<svelte:head>
  <title>OAuth Callback - Zoho-IT</title>
</svelte:head>

<div class="oauth-callback">
  <div class="container">
    {#if processing}
      <div class="processing">
        <div class="spinner"></div>
        <h2>Processing Zoho Authentication...</h2>
        <p>Please wait while we complete the authentication process.</p>
      </div>
    {:else if error}
      <div class="error">
        <div class="error-icon">❌</div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{error}</p>
        {#if debugInfo}
          <details class="debug-info">
            <summary>Debug Information</summary>
            <pre>{debugInfo}</pre>
          </details>
        {/if}
        <div class="actions">
          <a href="/" class="btn btn-primary">Return to Dashboard</a>
          <button on:click={() => window.location.reload()} class="btn btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    {:else if success}
      <div class="success">
        <div class="success-icon">✅</div>
        <h2>Authentication Successful!</h2>
        <p>Your Zoho account has been connected successfully.</p>
        <p class="redirect-message">Redirecting to dashboard...</p>
        <div class="actions">
          <a href="/" class="btn btn-primary">Go to Dashboard</a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .oauth-callback {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8f6f0 0%, #e8e6e0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .container {
    background: white;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    width: 100%;
  }

  .processing {
    color: #666;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #d4af37;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    color: #c33;
  }

  .success {
    color: #2e7d32;
  }

  .error-icon, .success-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #333;
  }

  p {
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 16px 0;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    padding: 12px;
    font-family: monospace;
    font-size: 14px;
    color: #c33;
    margin: 20px 0;
  }

  .redirect-message {
    font-style: italic;
    color: #666;
    font-size: 14px;
  }

  .actions {
    margin-top: 30px;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }

  .btn-primary {
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  }

  .btn-secondary {
    background: white;
    color: #666;
    border: 1px solid #ddd;
  }

  .btn-secondary:hover {
    background: #f5f5f5;
    border-color: #ccc;
  }

  .debug-info {
    margin: 20px 0;
    text-align: left;
  }

  .debug-info summary {
    cursor: pointer;
    font-weight: 600;
    color: #666;
    margin-bottom: 10px;
  }

  .debug-info pre {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  @media (max-width: 600px) {
    .container {
      padding: 30px 20px;
    }

    .actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
