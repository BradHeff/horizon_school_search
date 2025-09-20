import { SearchResult } from '../store/slices/searchSlice';
import { AuthService } from './authService';
import { openAIService, type ChatMessage } from './openAiService';

export type { ChatMessage };

export class AISearchService {
  private static modeChangeListeners: Array<(mode: 'search' | 'chat') => void> = [];

  static async searchForStudent(query: string): Promise<SearchResult[]> {
    try {
      const results = await openAIService.searchWithAI(query, 'student');
      if (results.length > 0) {
        return results.map(result => ({ ...result, relevance: 0.9 }));
      }
    } catch (error) {
      console.warn('AI search failed, using fallback results:', error);
    }

    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 800));

    const studentResults: SearchResult[] = [
      {
        id: '1',
        title: 'Assignment: Chapter 5 Math Review',
        description: 'Complete exercises 1-20 on algebra fundamentals. Due Friday.',
        url: '/assignments/math-chapter-5',
        category: 'Assignments',
        relevance: 0.95,
      },
      {
        id: '2',
        title: 'Study Guide: Biology Test',
        description: 'Cell structure and function study materials for upcoming test.',
        url: '/study-guides/biology-cells',
        category: 'Study Materials',
        relevance: 0.88,
      },
      {
        id: '3',
        title: 'Library Resources',
        description: 'Access digital books and research databases.',
        url: '/library',
        category: 'Resources',
        relevance: 0.75,
      },
    ];

    return this.filterResultsByQuery(studentResults, query);
  }

  static async searchForStaff(query: string): Promise<SearchResult[]> {
    try {
      const results = await openAIService.searchWithAI(query, 'staff');
      if (results.length > 0) {
        return results.map(result => ({ ...result, relevance: 0.9 }));
      }
    } catch (error) {
      console.warn('AI search failed, using fallback results:', error);
    }

    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 800));

    const staffResults: SearchResult[] = [
      {
        id: '4',
        title: 'Lesson Plan Template: Science',
        description: 'Interactive lesson plan template for science subjects.',
        url: '/templates/science-lesson',
        category: 'Teaching Resources',
        relevance: 0.92,
      },
      {
        id: '5',
        title: 'Assessment Rubric Generator',
        description: 'AI-powered tool to create custom assessment rubrics.',
        url: '/tools/rubric-generator',
        category: 'Assessment Tools',
        relevance: 0.89,
      },
      {
        id: '6',
        title: 'Student Performance Analytics',
        description: 'View detailed analytics on student progress and performance.',
        url: '/analytics/student-performance',
        category: 'Analytics',
        relevance: 0.85,
      },
      {
        id: '7',
        title: 'Curriculum Standards Alignment',
        description: 'Align your lessons with state and national standards.',
        url: '/tools/standards-alignment',
        category: 'Curriculum',
        relevance: 0.82,
      },
    ];

    return this.filterResultsByQuery(staffResults, query);
  }

  static async searchGuest(query: string): Promise<SearchResult[]> {
    try {
      const results = await openAIService.searchWithAI(query, 'guest');
      if (results.length > 0) {
        return results.map(result => ({ ...result, relevance: 0.9 }));
      }
    } catch (error) {
      console.warn('AI search failed, using fallback results:', error);
    }

    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 600));

    const guestResults: SearchResult[] = [
      {
        id: '8',
        title: 'School Information',
        description: 'Learn about Horizon Christian School mission and values.',
        url: '/about',
        category: 'Information',
        relevance: 0.80,
      },
      {
        id: '9',
        title: 'Contact Directory',
        description: 'Find contact information for school departments.',
        url: '/contact',
        category: 'Directory',
        relevance: 0.75,
      },
      {
        id: '10',
        title: 'Enrollment Information',
        description: 'Information about enrolling at Horizon Christian School.',
        url: '/enrollment',
        category: 'Admissions',
        relevance: 0.70,
      },
    ];

    return this.filterResultsByQuery(guestResults, query);
  }

  // New chat functionality for staff
  static async chatWithAI(messages: ChatMessage[]): Promise<string> {
    return await openAIService.chatWithAI(messages);
  }

  // Unified search method that uses role detection
  static async performSearch(query: string, userRole?: 'guest' | 'student' | 'staff'): Promise<SearchResult[]> {
    console.log('🚀 AISearchService.performSearch called:', { query, userRole });

    // If no role provided, try to get from current user
    if (!userRole) {
      const user = await AuthService.getCurrentUser();
      userRole = user?.role || 'guest';
      console.log('👤 Role determined from user:', userRole);
    }

    try {
      // Use the updated openAIService directly
      const results = await openAIService.searchWithAI(query, userRole);
      
      // Add relevance scores and ensure they match the expected interface
      const searchResults = results.map((result, index) => ({
        ...result,
        relevance: 0.9 - (index * 0.1) // Decreasing relevance for sorting
      }));
      
      console.log('✅ Search completed successfully:', searchResults.length, 'results');
      return searchResults;
    } catch (error) {
      console.error('❌ Search failed:', error);
      // Return empty array instead of old fallback methods
      return [];
    }
  }

  // Check if user can access chat mode (staff only)
  static canUseChat(userRole?: 'guest' | 'student' | 'staff'): boolean {
    return userRole === 'staff';
  }

  // Get current AI mode for user
  static getCurrentAIMode(): 'search' | 'chat' {
    const settings = AuthService.getUserSettings();
    return settings.aiMode;
  }

  // Set AI mode for user (staff only)
  static setAIMode(mode: 'search' | 'chat'): void {
    AuthService.saveUserSettings({ aiMode: mode });
    // Notify all listeners about the mode change
    this.modeChangeListeners.forEach(listener => listener(mode));
  }

  // Subscribe to AI mode changes
  static onModeChange(listener: (mode: 'search' | 'chat') => void): () => void {
    this.modeChangeListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.modeChangeListeners.indexOf(listener);
      if (index > -1) {
        this.modeChangeListeners.splice(index, 1);
      }
    };
  }

  private static filterResultsByQuery(results: SearchResult[], query: string): SearchResult[] {
    if (!query.trim()) {
      return results;
    }

    const queryLower = query.toLowerCase();
    return results
      .filter(result =>
        result.title.toLowerCase().includes(queryLower) ||
        result.description.toLowerCase().includes(queryLower) ||
        result.category.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => b.relevance - a.relevance);
  }
}