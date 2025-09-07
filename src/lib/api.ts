// API Configuration for Zoho-IT Asset Tracker
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    OAUTH: {
      AUTHORIZE: '/api/oauth/authorize',
      TOKEN: '/api/oauth/token',
      REFRESH: '/api/oauth/refresh'
    },
    ZOHO: {
      SYNC_ASSET: '/api/zoho/sync-asset'
    },
    ASSETS: '/api/assets',
    REQUESTS: '/api/requests',
    ASSIGNMENTS: '/api/assignments',
    DASHBOARD: '/api/dashboard'
  }
};

export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiCall(endpoint: string, options: ApiOptions = {}): Promise<any> {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call failed:', error);
    throw error;
  }
}
