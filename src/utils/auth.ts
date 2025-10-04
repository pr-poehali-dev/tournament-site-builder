const TOKEN_KEY = 'auth_token';

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
    return !!this.getToken();
  }
};
