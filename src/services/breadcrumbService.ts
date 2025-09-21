// Breadcrumb Service for Recent Searches and Chats
// Provides recent items for breadcrumb display

import { AuthService } from './authService';
import backendService, { ChatSession, SearchHistoryItem } from './backendService';

export interface BreadcrumbItem {
  id: string;
  type: 'search' | 'chat';
  title: string;
  subtitle?: string;
  timestamp: string;
  category?: string;
  onClick: () => void;
}

class BreadcrumbService {
  private recentSearches: SearchHistoryItem[] = [];
  private recentChats: ChatSession[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private isFetching: boolean = false;
  private fetchRetryCount: number = 0;
  private readonly MAX_RETRY_COUNT = 3;

  async getRecentItems(limit: number = 8): Promise<BreadcrumbItem[]> {
    await this.fetchRecentData();

    const items: BreadcrumbItem[] = [];

    // Add recent searches (always show for better UX)
    const searchItems = this.recentSearches.slice(0, Math.floor(limit / 2)).map(search => ({
      id: search.searchId,
      type: 'search' as const,
      title: search.query,
      subtitle: `${search.resultCount} results`,
      timestamp: search.searchedAt,
      category: search.category,
      onClick: () => this.handleSearchClick(search)
    }));

    // Add recent chats (staff only)
    const chatItems = this.recentChats.slice(0, Math.floor(limit / 2)).map(chat => ({
      id: chat.sessionId,
      type: 'chat' as const,
      title: chat.title,
      subtitle: `${chat.messageCount} messages`,
      timestamp: chat.lastMessageAt,
      category: chat.category,
      onClick: () => this.handleChatClick(chat)
    }));

    // Merge and sort by timestamp
    items.push(...searchItems, ...chatItems);
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  }

  async getRecentSearches(limit: number = 5): Promise<BreadcrumbItem[]> {
    await this.fetchRecentData();
    
    return this.recentSearches.slice(0, limit).map(search => ({
      id: search.searchId,
      type: 'search' as const,
      title: search.query,
      subtitle: `${search.resultCount} results`,
      timestamp: search.searchedAt,
      category: search.category,
      onClick: () => this.handleSearchClick(search)
    }));
  }

  async getRecentChats(limit: number = 5): Promise<BreadcrumbItem[]> {
    await this.fetchRecentData();
    
    return this.recentChats.slice(0, limit).map(chat => ({
      id: chat.sessionId,
      type: 'chat' as const,
      title: chat.title,
      subtitle: `${chat.messageCount} messages`,
      timestamp: chat.lastMessageAt,
      category: chat.category,
      onClick: () => this.handleChatClick(chat)
    }));
  }

  private async fetchRecentData(): Promise<void> {
    const now = Date.now();

    // Check if we need to fetch fresh data
    if (now - this.lastFetch < this.CACHE_DURATION) {
      return;
    }

    // Prevent concurrent fetches
    if (this.isFetching) {
      console.log('📋 Already fetching breadcrumb data, skipping...');
      return;
    }

    // Circuit breaker - stop trying if too many failures
    if (this.fetchRetryCount >= this.MAX_RETRY_COUNT) {
      console.warn('📋 Too many failed attempts, circuit breaker active');
      this.lastFetch = now; // Prevent immediate retry
      return;
    }

    this.isFetching = true;

    try {
      // Check frontend authentication first, then backend as fallback
      const isFrontendAuth = AuthService.isAuthenticated();
      const isBackendAuth = backendService.isAuthenticated();

      if (isFrontendAuth || isBackendAuth) {
        console.log('📋 User authenticated:', { frontend: isFrontendAuth, backend: isBackendAuth });
        console.log('📋 Fetching breadcrumb data...');

        // Add a small delay to ensure search has been processed by backend
        await new Promise(resolve => setTimeout(resolve, 1000));

        const [searches, chats] = await Promise.all([
          backendService.getRecentSearches(5).catch(err => {
            console.warn('📋 Failed to fetch recent searches:', err);
            return [];
          }),
          backendService.getRecentChats(5).catch(err => {
            console.warn('📋 Failed to fetch recent chats:', err);
            return [];
          })
        ]);

        console.log('📋 Raw backend response:', {
          searchesReceived: searches.length,
          chatsReceived: chats.length,
          searchData: searches,
          chatData: chats
        });

        // Always merge with existing cache for authenticated users
        // This ensures local searches show up even if backend is down
        if (searches.length > 0) {
          this.recentSearches = searches;
        }
        if (chats.length > 0) {
          this.recentChats = chats;
        }

        this.lastFetch = now;
        this.fetchRetryCount = 0; // Reset retry count on success

        console.log('📋 Breadcrumb data refreshed:', {
          searches: this.recentSearches.length,
          chats: this.recentChats.length,
          note: 'Preserving existing cache if backend returned empty'
        });
      } else {
        console.log('📋 User not authenticated, skipping breadcrumb fetch');
      }
    } catch (error) {
      console.error('📋 Failed to fetch recent data for breadcrumbs:', error);
      this.fetchRetryCount++;
      // Set lastFetch anyway to prevent immediate retry
      this.lastFetch = now;
    } finally {
      this.isFetching = false;
    }
  }

  private handleSearchClick(search: SearchHistoryItem): void {
    // Trigger a new search with the same query
    const searchEvent = new CustomEvent('breadcrumb-search', {
      detail: { 
        query: search.query,
        searchId: search.searchId,
        category: search.category
      }
    });
    window.dispatchEvent(searchEvent);
    
    console.log('🔍 Breadcrumb search clicked:', search.query);
  }

  private handleChatClick(chat: ChatSession): void {
    // Open the chat session
    const chatEvent = new CustomEvent('breadcrumb-chat', {
      detail: { 
        sessionId: chat.sessionId,
        title: chat.title,
        category: chat.category
      }
    });
    window.dispatchEvent(chatEvent);
    
    console.log('💬 Breadcrumb chat clicked:', chat.title);
  }

  // Utility methods
  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return time.toLocaleDateString();
    }
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'lesson-planning': '📝',
      'curriculum': '📚',
      'assessment': '📊',
      'research': '🔬',
      'resources': '📋',
      'administration': '🏢',
      'student-support': '🎓',
      'technology': '💻',
      'general': '🔍'
    };
    
    return iconMap[category] || '🔍';
  }

  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'lesson-planning': '#10b981',
      'curriculum': '#3b82f6',
      'assessment': '#f59e0b',
      'research': '#8b5cf6',
      'resources': '#06b6d4',
      'administration': '#6b7280',
      'student-support': '#ef4444',
      'technology': '#84cc16',
      'general': '#64748b'
    };
    
    return colorMap[category] || '#64748b';
  }

  // Clear cache when user logs out
  clearCache(): void {
    this.recentSearches = [];
    this.recentChats = [];
    this.lastFetch = 0;
    this.isFetching = false;
    this.fetchRetryCount = 0;
    console.log('🧹 Breadcrumb cache cleared');
  }

  // Force refresh
  async refreshData(): Promise<void> {
    this.lastFetch = 0;
    this.fetchRetryCount = 0; // Reset retry count on manual refresh
    await this.fetchRecentData();
  }

  // Add new search to cache immediately for real-time updates
  addRecentSearch(searchData: {
    searchId: string;
    query: string;
    searchType?: 'web' | 'ai' | 'hybrid';
    category: string;
    resultCount: number;
    hasAiAnswer?: boolean;
  }): void {
    const newSearch: SearchHistoryItem = {
      searchId: searchData.searchId,
      query: searchData.query,
      searchType: searchData.searchType || 'ai',
      category: searchData.category,
      topics: [],
      searchedAt: new Date().toISOString(),
      hasAiAnswer: searchData.hasAiAnswer || false,
      resultCount: searchData.resultCount,
    };

    // Add to beginning of array and limit to 5
    this.recentSearches.unshift(newSearch);
    this.recentSearches = this.recentSearches.slice(0, 5);

    console.log('📋 Added new search to breadcrumb cache:', newSearch.query);
  }

  // Add new chat to cache immediately for real-time updates
  addRecentChat(chatData: {
    sessionId: string;
    title: string;
    category?: string;
    messageCount?: number;
  }): void {
    const newChat: ChatSession = {
      sessionId: chatData.sessionId,
      title: chatData.title,
      messages: [],
      lastMessageAt: new Date().toISOString(),
      messageCount: chatData.messageCount || 1,
      category: chatData.category || 'general',
      tags: [],
      totalTokens: 0,
      createdAt: new Date().toISOString(),
    };

    // Add to beginning of array and limit to 5
    this.recentChats.unshift(newChat);
    this.recentChats = this.recentChats.slice(0, 5);

    console.log('📋 Added new chat to breadcrumb cache:', newChat.title);
  }
}

// Create singleton instance
export const breadcrumbService = new BreadcrumbService();
export default breadcrumbService;