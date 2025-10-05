const TOKEN_KEY = 'auth_token';
const AUTH_ENDPOINT = 'https://functions.poehali.dev/c8519cb6-9df9-4faf-a146-2fedd66d1623';

// Decode JWT token to get expiration time
function decodeToken(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export const authUtils = {
  // Save token to localStorage
  saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Remove token from localStorage
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Get headers with auth token
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['X-Auth-Token'] = token;
    }
    
    return headers;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  },

  // Check if token needs refresh (expires in less than 15 minutes)
  needsRefresh(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    // Refresh if less than 15 minutes (900 seconds) remaining
    return timeUntilExpiry > 0 && timeUntilExpiry < 900;
  },

  // Refresh token
  async refreshToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const response = await fetch(`${AUTH_ENDPOINT}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        }
      });
      
      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        return false;
      }
      
      const data = await response.json();
      if (data.success && data.token) {
        this.saveToken(data.token);
        console.log('✅ Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  // Auto-refresh token if needed
  async autoRefreshIfNeeded(): Promise<void> {
    if (this.needsRefresh()) {
      console.log('🔄 Token expiring soon, refreshing...');
      const success = await this.refreshToken();
      if (!success) {
        console.warn('⚠️ Failed to refresh token');
      }
    }
  }
};