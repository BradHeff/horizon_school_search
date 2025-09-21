// Backend API Service for Horizon Search
// Handles all communication with the Node.js backend server

export interface BackendUser {
  id: string;
  azureId: string;
  email: string;
  name: string;
  displayName?: string;
  role: 'guest' | 'student' | 'staff';
  licenses: string[];
  settings: {
    aiMode: 'search' | 'chat';
    chatEnabled: boolean;
    rememberMe: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  lastLogin: string;
  lastActivity?: string;
}

export interface LoginResponse {
  success: boolean;
  user: BackendUser;
  tokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface ChatSession {
  sessionId: string;
  title: string;
  messages: ChatMessage[];
  lastMessageAt: string;
  messageCount: number;
  category: string;
  tags: string[];
  totalTokens: number;
  createdAt: string;
}

export interface SearchHistoryItem {
  searchId: string;
  query: string;
  searchType: 'web' | 'ai' | 'hybrid';
  category: string;
  topics: string[];
  searchedAt: string;
  hasAiAnswer: boolean;
  resultCount: number;
  responseTime?: number;
  isBookmarked?: boolean;
  isFavorite?: boolean;
}

class BackendService {
  private baseUrl: string = 'https://search-api.horizon.sa.edu.au'; // Default fallback for production
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private initialized: boolean = false;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
    // Initialize base URL from config
    this.initializeBaseUrl();
  }

  private async initializeBaseUrl(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Try to get backend URL from runtime config
      const response = await fetch('/env.json');
      if (response.ok) {
        const config = await response.json();
        this.baseUrl = config.BACKEND_URL || 'https://search-api.horizon.sa.edu.au';
      } else {
        // Fallback to environment variable or production default
        this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://search-api.horizon.sa.edu.au';
      }
    } catch (error) {
      console.warn('Failed to load backend URL from config, using default:', error);
      this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://search-api.horizon.sa.edu.au';
    }
    
    this.initialized = true;
    console.log('🔗 Backend service initialized:', this.baseUrl);
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('horizon_access_token');
    this.refreshToken = localStorage.getItem('horizon_refresh_token');
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string | null): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    localStorage.setItem('horizon_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('horizon_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('horizon_refresh_token');
    }
  }

  private clearTokensFromStorage(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('horizon_access_token');
    localStorage.removeItem('horizon_refresh_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    // Ensure backend URL is initialized
    await this.initializeBaseUrl();
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (requireAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration
      if (response.status === 401 && requireAuth) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.code === 'TOKEN_EXPIRED' && this.refreshToken) {
          console.log('🔄 Access token expired, attempting refresh...');
          const refreshed = await this.refreshAccessToken();
          
          if (refreshed) {
            // Retry the original request with new token
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            
            if (!retryResponse.ok) {
              throw new Error(`Request failed: ${retryResponse.status}`);
            }
            
            return await retryResponse.json();
          }
        }
        
        // If refresh failed or no refresh token, clear auth and throw error
        this.clearTokensFromStorage();
        throw new Error('Authentication expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Backend request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication Methods
  async login(userData: {
    azureId: string;
    email: string;
    name: string;
    displayName?: string;
    licenses: string[];
    rememberMe: boolean;
  }): Promise<LoginResponse> {
    console.log('🔐 Logging in to backend...', { email: userData.email, rememberMe: userData.rememberMe });
    
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, false);

    if (response.success && response.tokens) {
      this.saveTokensToStorage(response.tokens.accessToken, response.tokens.refreshToken);
      console.log('✅ Backend login successful');
    }

    return response;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await this.makeRequest<{
        success: boolean;
        accessToken: string;
        user: BackendUser;
      }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }, false);

      if (response.success) {
        this.saveTokensToStorage(response.accessToken, this.refreshToken);
        console.log('✅ Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearTokensFromStorage();
    }

    return false;
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if backend request fails
    } finally {
      this.clearTokensFromStorage();
      console.log('🚪 Logged out from backend');
    }
  }

  async getCurrentUser(): Promise<BackendUser | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await this.makeRequest<{ success: boolean; user: BackendUser }>('/auth/me');
      return response.success ? response.user : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // User Settings Methods
  async updateUserSettings(settings: Partial<BackendUser['settings']>): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      
      console.log('⚙️ User settings updated:', settings);
      return response.success;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      return false;
    }
  }

  // Chat Methods
  async getRecentChats(limit: number = 10): Promise<ChatSession[]> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        recentChats: Array<{
          sessionId: string;
          title: string;
          lastMessageAt: string;
          messageCount: number;
          category: string;
        }>;
      }>(`/chats/recent?limit=${limit}`);
      
      return response.success ? response.recentChats.map(chat => ({
        ...chat,
        messages: [], // Will be loaded separately when needed
        tags: [],
        totalTokens: 0,
        createdAt: chat.lastMessageAt
      })) : [];
    } catch (error) {
      console.error('Failed to get recent chats:', error);
      return [];
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; chat: ChatSession }>(`/chats/${sessionId}`);
      return response.success ? response.chat : null;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  async createChatSession(title?: string, category?: string): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        chat: { sessionId: string } 
      }>('/chats', {
        method: 'POST',
        body: JSON.stringify({ title, category }),
      });
      
      return response.success ? response.chat.sessionId : null;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
  }

  async addChatMessage(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    tokens?: { input: number; output: number }
  ): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(`/chats/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ role, content, tokens }),
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to add chat message:', error);
      return false;
    }
  }

  // Search History Methods
  async getRecentSearches(limit: number = 10): Promise<SearchHistoryItem[]> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        recentSearches: SearchHistoryItem[];
      }>(`/searches/recent?limit=${limit}`);
      
      return response.success ? response.recentSearches : [];
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  async saveSearch(searchData: {
    query: string;
    searchType?: 'web' | 'ai' | 'hybrid';
    aiMode?: 'search' | 'chat';
    resultCount?: number;
    hasAiAnswer?: boolean;
    responseTime?: number;
    topResults?: Array<{ title: string; url: string; domain: string; snippet: string }>;
    aiAnswerSummary?: string;
  }): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        searchId: string | null;
      }>('/searches', {
        method: 'POST',
        body: JSON.stringify({
          ...searchData,
          userAgent: navigator.userAgent,
          deviceType: this.getDeviceType(),
        }),
      }, false); // Don't require auth - endpoint handles optional auth
      
      return response.success ? response.searchId : null;
    } catch (error) {
      console.error('Failed to save search:', error);
      return null;
    }
  }

  async trackSearchClick(searchId: string, url: string, title: string): Promise<void> {
    try {
      await this.makeRequest(`/searches/${searchId}/click`, {
        method: 'POST',
        body: JSON.stringify({ url, title }),
      }, false); // Don't require auth - endpoint handles optional auth
    } catch (error) {
      console.error('Failed to track search click:', error);
      // Don't throw - this is non-critical tracking
    }
  }

  async trackSearch(searchData: {
    query: string;
    resultCount: number;
    category: string;
    userRole?: 'guest' | 'student' | 'staff';
    searchType?: 'web' | 'ai' | 'hybrid';
    responseTime?: number;
  }): Promise<string | null> {
    try {
      console.log('📊 Tracking search with auth:', {
        query: searchData.query,
        category: searchData.category,
        userRole: searchData.userRole,
        hasToken: !!this.accessToken
      });

      const response = await this.makeRequest<{
        success: boolean;
        searchId: string | null;
      }>('/searches/track', {
        method: 'POST',
        body: JSON.stringify({
          ...searchData,
          searchType: searchData.searchType || 'ai',
          userAgent: navigator.userAgent,
          deviceType: this.getDeviceType(),
        }),
      }, true); // Require auth for proper search tracking

      console.log('📊 Backend track response:', response);
      return response.success ? response.searchId : null;
    } catch (error) {
      console.error('📊 Failed to track search:', error);
      return null;
    }
  }

  // Utility Methods
  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  hasValidRefreshToken(): boolean {
    return !!this.refreshToken;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('/health', {}, false);
      return response.status === 'OK';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const backendService = new BackendService();
export default backendService;