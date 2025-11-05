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
  groups?: string[];
  isAdmin?: boolean;
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
  // NEW: Trigger/Moderation fields
  contentRating?: number;
  trigger?: 'bad' | 'questionable' | 'safe' | null;
  triggerReason?: string;
  isModerated?: boolean;
  moderationAction?: 'approved' | 'blocked' | 'flagged' | null;
}

// NEW: Bookmark interface
export interface Bookmark {
  bookmarkId: string;
  userId: string;
  title: string;
  query: string;
  category: string;
  searchType: 'ai' | 'web' | 'hybrid';
  resultSnapshot?: {
    aiAnswer?: string;
    topResults?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
  tags: string[];
  notes?: string;
  folder: string;
  isFavorite: boolean;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
}

// NEW: Moderation Rule interface
export interface ModerationRule {
  _id?: string;
  ruleType: 'domain' | 'keyword' | 'url' | 'pattern';
  action: 'allow' | 'block' | 'flag';
  value: string;
  pattern?: string;
  caseSensitive?: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  hitCount?: number;
  lastHitAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// NEW: Content Rating interface
export interface ContentRating {
  score: number;
  trigger: 'bad' | 'questionable' | 'safe';
  reasons: Array<{
    source: string;
    reason: string;
    severity: string;
  }>;
  details: {
    queryScore: number;
    resultsScore: number;
    aiAnswerScore: number;
  };
}

// NEW: Analytics interfaces
export interface AnalyticsOverview {
  overview: {
    totalSearches: number;
    activeUsers: number;
    aiAnswerRate: string;
  };
  searchesByType: {
    web?: number;
    ai?: number;
    hybrid?: number;
  };
  searchesByCategory: Array<{
    category: string;
    count: number;
  }>;
  topQueries: Array<{
    query: string;
    count: number;
    avgResults: number;
  }>;
  dailyTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface UserStats {
  searchStats: {
    totalSearches: number;
    recentSearches: number;
    averagePerDay: string;
  };
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  weeklyTrends: Array<{
    date: string;
    count: number;
  }>;
  chatStats?: {
    totalSessions: number;
    totalMessages: number;
  };
}

export interface ModerationStats {
  triggers: {
    bad?: number;
    questionable?: number;
    safe?: number;
    none?: number;
  };
  moderation: {
    moderated: number;
    unmoderated: number;
    needsAttention: number;
  };
  rules: Array<{
    type: string;
    action: string;
    count: number;
  }>;
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

    if (this.accessToken || this.refreshToken) {
      console.log('📂 Loaded tokens from storage', {
        hasAccessToken: !!this.accessToken,
        accessTokenPrefix: this.accessToken?.substring(0, 20) + '...',
        hasRefreshToken: !!this.refreshToken
      });
    }
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

    console.log('💾 Tokens saved to storage', {
      accessTokenLength: accessToken?.length || 0,
      accessTokenPrefix: accessToken?.substring(0, 20) + '...',
      hasRefreshToken: !!refreshToken,
      isAuthenticatedNow: this.isAuthenticated()
    });
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
      console.log('🔑 Making authenticated request to', endpoint, {
        hasToken: !!this.accessToken,
        tokenPrefix: this.accessToken?.substring(0, 20) + '...'
      });
    } else if (requireAuth && !this.accessToken) {
      console.warn('⚠️ Making request to', endpoint, 'but no access token available');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important: This sends cookies with the request
      });

      // Handle token expiration
      if (response.status === 401 && requireAuth) {
        const errorData = await response.json().catch(() => ({}));

        // Try to refresh the token
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.message?.includes('expired') || errorData.message?.includes('invalid')) {
          console.log('🔄 Access token expired, attempting refresh...');

          // First try using refresh token
          let refreshed = false;
          if (this.refreshToken) {
            refreshed = await this.refreshAccessToken();
          }

          // If no refresh token or refresh failed, try re-authenticating with MSAL
          if (!refreshed) {
            console.log('🔄 No refresh token or refresh failed, attempting MSAL re-authentication...');
            refreshed = await this.refreshWithMSAL();
          }

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

        // If refresh failed, clear auth and throw error
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
    groups?: string[];
    rememberMe: boolean;
  }): Promise<LoginResponse> {
    console.log('🔐 Logging in to backend...', {
      email: userData.email,
      rememberMe: userData.rememberMe,
      backendUrl: this.baseUrl
    });

    try {
      const response = await this.makeRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(userData),
      }, false);

      if (response.success && response.tokens) {
        this.saveTokensToStorage(response.tokens.accessToken, response.tokens.refreshToken);
        console.log('✅ Backend login successful', {
          hasAccessToken: !!response.tokens.accessToken,
          hasRefreshToken: !!response.tokens.refreshToken
        });
      } else {
        console.warn('⚠️ Backend login returned unsuccessful response:', {
          success: response.success,
          hasTokens: !!(response as any).tokens
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Backend login request failed:', error);
      console.error('❌ Backend URL:', this.baseUrl);
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
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

  async refreshWithMSAL(): Promise<boolean> {
    try {
      // Import AuthService dynamically to avoid circular dependencies
      const { AuthService } = await import('./authService');

      // Get the current MSAL account and fresh token
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        console.warn('⚠️ No MSAL user found, cannot refresh backend token');
        return false;
      }

      console.log('🔄 Re-authenticating backend with MSAL user...');

      // Re-login to backend with MSAL credentials (without rememberMe to avoid loops)
      const response = await this.makeRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          azureId: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          displayName: currentUser.name,
          licenses: [], // License check not needed for refresh
          rememberMe: false
        }),
      }, false);

      if (response.success && response.tokens) {
        this.saveTokensToStorage(response.tokens.accessToken, response.tokens.refreshToken);
        console.log('✅ Backend token refreshed successfully via MSAL');
        return true;
      }
    } catch (error) {
      console.error('❌ MSAL-based token refresh failed:', error);
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

  // ============= NEW: Bookmarks Methods =============

  async getBookmarks(filters?: {
    category?: string;
    folder?: string;
    favorite?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<{ bookmarks: Bookmark[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.folder) params.append('folder', filters.folder);
      if (filters?.favorite !== undefined) params.append('favorite', String(filters.favorite));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.skip) params.append('skip', String(filters.skip));

      const response = await this.makeRequest<{ bookmarks: Bookmark[]; total: number }>(
        `/bookmarks?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return { bookmarks: [], total: 0 };
    }
  }

  async createBookmark(data: {
    title: string;
    query: string;
    category?: string;
    searchType?: 'ai' | 'web' | 'hybrid';
    resultSnapshot?: any;
    tags?: string[];
    notes?: string;
    folder?: string;
  }): Promise<Bookmark | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; bookmark: Bookmark }>(
        '/bookmarks',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.success ? response.bookmark : null;
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      return null;
    }
  }

  async updateBookmark(bookmarkId: string, data: Partial<Bookmark>): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/bookmarks/${bookmarkId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      return false;
    }
  }

  async deleteBookmark(bookmarkId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/bookmarks/${bookmarkId}`,
        { method: 'DELETE' }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      return false;
    }
  }

  async bulkDeleteBookmarks(bookmarkIds: string[]): Promise<number> {
    try {
      const response = await this.makeRequest<{ success: boolean; deletedCount: number }>(
        '/bookmarks/bulk-delete',
        {
          method: 'POST',
          body: JSON.stringify({ bookmarkIds }),
        }
      );
      return response.deletedCount || 0;
    } catch (error) {
      console.error('Failed to bulk delete bookmarks:', error);
      return 0;
    }
  }

  async getBookmarkFolders(): Promise<string[]> {
    try {
      const response = await this.makeRequest<{ folders: string[] }>('/bookmarks/folders');
      return response.folders;
    } catch (error) {
      console.error('Failed to get bookmark folders:', error);
      return [];
    }
  }

  async exportBookmarks(): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bookmarks/export/json`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error('Failed to export bookmarks:', error);
      return null;
    }
  }

  // ============= NEW: Analytics Methods =============

  async getAnalyticsOverview(dateRange?: { startDate?: string; endDate?: string }): Promise<AnalyticsOverview | null> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const response = await this.makeRequest<AnalyticsOverview>(
        `/analytics/overview?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get analytics overview:', error);
      return null;
    }
  }

  async getUserStats(): Promise<UserStats | null> {
    try {
      const response = await this.makeRequest<UserStats>('/analytics/user-stats');
      return response;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  async getTopicAnalytics(limit: number = 50): Promise<Array<{ topic: string; count: number }>> {
    try {
      const response = await this.makeRequest<{ topics: Array<{ topic: string; count: number }> }>(
        `/analytics/topics?limit=${limit}`
      );
      return response.topics;
    } catch (error) {
      console.error('Failed to get topic analytics:', error);
      return [];
    }
  }

  async getPerformanceMetrics(dateRange?: { startDate?: string; endDate?: string }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const response = await this.makeRequest<any>(
        `/analytics/performance?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }

  async getEngagementMetrics(): Promise<any> {
    try {
      const response = await this.makeRequest<any>('/analytics/engagement');
      return response;
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      return null;
    }
  }

  // ============= NEW: Moderation Methods =============

  async getModerationRules(filters?: {
    ruleType?: string;
    action?: string;
    isActive?: boolean;
  }): Promise<ModerationRule[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.ruleType) params.append('ruleType', filters.ruleType);
      if (filters?.action) params.append('action', filters.action);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const response = await this.makeRequest<{ success: boolean; rules: ModerationRule[] }>(
        `/moderation/rules?${params.toString()}`
      );
      return response.rules || [];
    } catch (error) {
      console.error('Failed to get moderation rules:', error);
      return [];
    }
  }

  async createModerationRule(rule: Omit<ModerationRule, '_id' | 'createdAt' | 'updatedAt'>): Promise<ModerationRule | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; rule: ModerationRule }>(
        '/moderation/rules',
        {
          method: 'POST',
          body: JSON.stringify(rule),
        }
      );
      return response.success ? response.rule : null;
    } catch (error) {
      console.error('Failed to create moderation rule:', error);
      return null;
    }
  }

  async updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/moderation/rules/${ruleId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to update moderation rule:', error);
      return false;
    }
  }

  async deleteModerationRule(ruleId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/moderation/rules/${ruleId}`,
        { method: 'DELETE' }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to delete moderation rule:', error);
      return false;
    }
  }

  async toggleModerationRule(ruleId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/moderation/rules/${ruleId}/toggle`,
        { method: 'PATCH' }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to toggle moderation rule:', error);
      return false;
    }
  }

  async getSearchesByTrigger(trigger?: string, options?: {
    limit?: number;
    skip?: number;
    includeModerated?: boolean;
  }): Promise<{ searches: SearchHistoryItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (trigger) params.append('trigger', trigger);
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.skip) params.append('skip', String(options.skip));
      if (options?.includeModerated) params.append('includeModerated', String(options.includeModerated));

      const response = await this.makeRequest<{ success: boolean; searches: SearchHistoryItem[]; total: number }>(
        `/moderation/searches?${params.toString()}`
      );
      return { searches: response.searches || [], total: response.total || 0 };
    } catch (error) {
      console.error('Failed to get searches by trigger:', error);
      return { searches: [], total: 0 };
    }
  }

  async moderateSearch(searchId: string, action: 'approved' | 'blocked' | 'flagged', reason?: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        `/moderation/searches/${searchId}/moderate`,
        {
          method: 'POST',
          body: JSON.stringify({ action, reason }),
        }
      );
      return response.success;
    } catch (error) {
      console.error('Failed to moderate search:', error);
      return false;
    }
  }

  async getModeratedSearches(action: 'flagged' | 'blocked' | 'approved', options?: {
    limit?: number;
    skip?: number;
  }): Promise<{ searches: SearchHistoryItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('includeModerated', 'true');
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.skip) params.append('skip', String(options.skip));

      const response = await this.makeRequest<{ success: boolean; searches: SearchHistoryItem[]; total: number }>(
        `/moderation/searches?${params.toString()}`
      );

      // Filter by moderation action on the client side
      const filtered = (response.searches || []).filter(s => s.moderationAction === action);

      return { searches: filtered, total: filtered.length };
    } catch (error) {
      console.error('Failed to get moderated searches:', error);
      return { searches: [], total: 0 };
    }
  }

  async getModerationStats(): Promise<ModerationStats | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; stats: ModerationStats }>(
        '/moderation/stats'
      );
      return response.stats;
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return null;
    }
  }

  async rateContent(query: string, results?: any[], aiAnswer?: string): Promise<ContentRating | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; rating: ContentRating }>(
        '/moderation/rate-query',
        {
          method: 'POST',
          body: JSON.stringify({ query, results, aiAnswer }),
        }
      );
      return response.rating;
    } catch (error) {
      console.error('Failed to rate content:', error);
      return null;
    }
  }

  async testContent(content: string, contentType?: string): Promise<any> {
    try {
      const response = await this.makeRequest<{ success: boolean; result: any }>(
        '/moderation/test-content',
        {
          method: 'POST',
          body: JSON.stringify({ content, contentType }),
        }
      );
      return response.result;
    } catch (error) {
      console.error('Failed to test content:', error);
      return null;
    }
  }

  async checkContentModeration(content: string, contentType: string = 'query'): Promise<any> {
    try {
      const result = await this.testContent(content, contentType);
      return result;
    } catch (error) {
      console.error('Failed to check content moderation:', error);
      return null;
    }
  }

  // QuickLinks Management Methods

  async getQuickLinks(options?: { category?: string; grouped?: boolean; role?: string }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.grouped) params.append('grouped', 'true');

      const response = await this.makeRequest<{ success: boolean; links: any[]; count: number }>(
        `/quicklinks?${params.toString()}`,
        {},
        false // Public endpoint
      );
      return response.links;
    } catch (error) {
      console.error('Failed to get quick links:', error);
      return [];
    }
  }

  async getQuickLinksForAdmin(filters?: { category?: string; isActive?: boolean; role?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.role) params.append('role', filters.role);

      const response = await this.makeRequest<{ success: boolean; links: any[] }>(
        `/quicklinks/admin?${params.toString()}`
      );
      return response.links || [];
    } catch (error) {
      console.error('Failed to get admin quick links:', error);
      return [];
    }
  }

  async createQuickLink(linkData: {
    title: string;
    url: string;
    description?: string;
    icon?: string;
    category: string;
    roles: string[];
    order?: number;
    isActive?: boolean;
  }): Promise<any> {
    try {
      const response = await this.makeRequest<{ success: boolean; link: any }>(
        '/quicklinks',
        {
          method: 'POST',
          body: JSON.stringify(linkData),
        }
      );
      return response.link;
    } catch (error) {
      console.error('Failed to create quick link:', error);
      throw error;
    }
  }

  async updateQuickLink(linkId: string, updateData: any): Promise<any> {
    try {
      const response = await this.makeRequest<{ success: boolean; link: any }>(
        `/quicklinks/${linkId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );
      return response.link;
    } catch (error) {
      console.error('Failed to update quick link:', error);
      throw error;
    }
  }

  async deleteQuickLink(linkId: string): Promise<boolean> {
    try {
      await this.makeRequest<{ success: boolean }>(
        `/quicklinks/${linkId}`,
        {
          method: 'DELETE',
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to delete quick link:', error);
      return false;
    }
  }

  async toggleQuickLink(linkId: string): Promise<any> {
    try {
      const response = await this.makeRequest<{ success: boolean; link: any }>(
        `/quicklinks/${linkId}/toggle`,
        {
          method: 'PATCH',
        }
      );
      return response.link;
    } catch (error) {
      console.error('Failed to toggle quick link:', error);
      throw error;
    }
  }

  async trackQuickLinkClick(linkId: string): Promise<void> {
    try {
      await this.makeRequest<{ success: boolean }>(
        `/quicklinks/${linkId}/click`,
        {
          method: 'POST',
        },
        false // Don't require auth for click tracking
      );
    } catch (error) {
      console.error('Failed to track link click:', error);
      // Don't throw - tracking failures shouldn't block navigation
    }
  }

  async getQuickLinksStats(): Promise<any> {
    try {
      const response = await this.makeRequest<{ success: boolean; stats: any }>(
        '/quicklinks/stats/summary'
      );
      return response.stats;
    } catch (error) {
      console.error('Failed to get quick links stats:', error);
      return null;
    }
  }
}

// Create singleton instance
export const backendService = new BackendService();
export default backendService;