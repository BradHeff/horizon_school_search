import { getConfig } from '../config/app-config';
import type { SearchResult } from '../store/slices/searchSlice';
import { openAIService } from './openAiService';
import { cacheService } from './cacheService';

export interface LangSearchResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayUrl: string;
  datePublished?: string;
  dateLastCrawled?: string;
}

export interface LangSearchResponse {
  code: number;
  log_id: string;
  msg: string | null;
  data: {
    _type: string;
    queryContext: {
      originalQuery: string;
    };
    webPages: {
      webSearchUrl: string;
      totalEstimatedMatches: number | null;
      value: LangSearchResult[];
      someResultsRemoved: boolean;
    };
  };
}

export interface AIInstantAnswer {
  answer: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
}

export class WebSearchService {

  /**
   * Generates an AI instant answer based on search query and web results
   */
  static async generateInstantAnswer(query: string, searchResults: SearchResult[], userRole: 'guest' | 'student' | 'staff' = 'guest'): Promise<AIInstantAnswer | null> {
    console.log('🤖 Generating AI instant answer for:', query);

    // Check cache first
    const cacheKey = `instant_answer:${query}`;
    const cachedAnswer = cacheService.get<AIInstantAnswer>(cacheKey, userRole);
    if (cachedAnswer) {
      return cachedAnswer;
    }

    try {
      // Create shorter context from search results to reduce token usage
      const context = searchResults.slice(0, 3).map(result =>
        `${result.title.substring(0, 80)}...: ${result.description.substring(0, 120)}...`
      ).join('\n');

      // Create different prompts based on user role
      let prompt: string;
      let systemMessage: string;

      if (userRole === 'staff') {
        // Staff get more detailed responses with less restrictions
        systemMessage = 'Answer questions based on search results. Be accurate and concise.';
        prompt = `Question: "${query}"

Results:
${context}

Answer (2-3 sentences):`;
      } else {
        // Guest/Student get simple, direct answers
        systemMessage = 'Answer questions simply for students using the search results.';
        prompt = `Question: "${query}"

Results:
${context}

Simple answer (1-2 sentences):`;
      }

      const aiResponse = await openAIService.chatWithAI([
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ], userRole === 'staff' ? 400 : 300); // Reduced token limits for faster responses

      console.log('🤖 Raw AI response:', aiResponse);
      console.log('🤖 AI response length:', aiResponse?.length || 0);

      if (!aiResponse || aiResponse.includes('unable to process') || aiResponse.length < 10) {
        console.log('❌ AI instant answer failed or returned insufficient content');
        console.log('❌ Failure reason:', {
          noResponse: !aiResponse,
          containsError: aiResponse?.includes('unable to process'),
          tooShort: aiResponse && aiResponse.length < 10,
          actualLength: aiResponse?.length || 0
        });
        return null;
      }

      // Extract source URLs from the results used
      const sources = searchResults.slice(0, 5).map(result => result.url);

      // Determine confidence based on response quality and source count
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (searchResults.length >= 3 && aiResponse.length > 100) {
        confidence = 'high';
      } else if (searchResults.length < 2 || aiResponse.length < 50) {
        confidence = 'low';
      }

      console.log('✅ AI instant answer generated successfully');

      const instantAnswer: AIInstantAnswer = {
        answer: aiResponse.trim(),
        sources,
        confidence
      };

      // Cache the response for future use (5-minute TTL)
      cacheService.set(cacheKey, instantAnswer, userRole, 5 * 60 * 1000);

      return instantAnswer;

    } catch (error) {
      console.error('❌ Failed to generate AI instant answer:', error);
      return null;
    }
  }

  /**
   * Performs a web search using LangSearch and filters results through AI for child safety
   */
  static async searchWeb(query: string, userRole: 'guest' | 'student' | 'staff'): Promise<SearchResult[]> {
    console.log('🌐 WebSearchService: Starting LangSearch web search for:', { query, userRole });

    // Check cache for search results first
    const searchCacheKey = `search_results:${query}`;
    const cachedResults = cacheService.get<SearchResult[]>(searchCacheKey, userRole);
    if (cachedResults) {
      return cachedResults;
    }

    try {
      // Step 1: Get raw results from LangSearch
      const rawResults = await this.fetchLangSearchResults(query);
      console.log('📡 LangSearch raw results:', rawResults.length, 'items');

      if (rawResults.length === 0) {
        console.log('⚠️ No results from LangSearch, using educational fallbacks');
        return this.getEducationalFallbacks(query);
      }

      // Step 2: Apply domain filtering based on user role
      const resultSummary = rawResults.map((result, index) => ({
        id: index + 1,
        title: result.name,
        description: this.cleanText(result.snippet),
        url: result.url,
        domain: this.extractDomain(result.url)
      }));

      const filteredResults = this.basicDomainFilter(resultSummary, userRole);
      console.log('🛡️ Domain filtered results:', filteredResults.length, 'safe results');

      // Step 3: If no results pass the filter, provide educational fallbacks
      if (filteredResults.length === 0) {
        console.log('⚠️ No results passed domain filtering, using educational fallbacks');
        return this.getEducationalFallbacks(query);
      }

      // Cache the successful results (3-minute TTL for search results)
      cacheService.set(searchCacheKey, filteredResults, userRole, 3 * 60 * 1000);

      return filteredResults;
    } catch (error) {
      console.error('❌ LangSearch web search failed:', error);
      // Always provide educational fallbacks on any error
      return this.getEducationalFallbacks(query);
    }
  }

  /**
   * Fetches search results from LangSearch API
   */
  private static async fetchLangSearchResults(query: string): Promise<LangSearchResult[]> {
    const config = await getConfig();

    console.log('🔍 Fetching from LangSearch:', config.search.apiEndpoint);

    const requestBody = {
      query: query,
      freshness: 'noLimit',
      summary: false, // Disable long summaries for faster response
      count: 8 // Get 8 results for good filtering options
    };

    console.log('📤 LangSearch request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(config.search.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.search.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LangSearch API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`LangSearch API error: ${response.status} - ${errorText}`);
    }

    const data: LangSearchResponse = await response.json();
    console.log('📡 LangSearch raw response:', JSON.stringify(data, null, 2));

    // Extract results from response (correct path: data.webPages.value)
    const results = data.data?.webPages?.value || [];
    console.log('📊 Total LangSearch results collected:', results.length);

    // If no results, log for debugging
    if (results.length === 0) {
      console.warn('⚠️ No results from LangSearch for query:', query);
      console.log('📋 Response structure check:', {
        hasData: !!data.data,
        hasWebPages: !!data.data?.webPages,
        hasValue: !!data.data?.webPages?.value,
        valueLength: data.data?.webPages?.value?.length || 0
      });
    }

    return results;
  }

  /**
   * Filters search results through AI to ensure child safety
   */
  private static async filterResultsWithAI(
    rawResults: LangSearchResult[],
    originalQuery: string,
    userRole: 'guest' | 'student' | 'staff'
  ): Promise<SearchResult[]> {

    // Create a concise summary of results for AI analysis
    const resultSummary = rawResults.map((result, index) => ({
      id: index + 1,
      title: result.name, // LangSearch uses 'name' instead of 'title'
      description: this.cleanText(result.snippet),
      url: result.url,
      domain: this.extractDomain(result.url)
    }));

    const filterPrompt = this.buildFilterPrompt(originalQuery, resultSummary, userRole);

    try {
      console.log('🤖 Sending results to AI for safety filtering...');
      const aiResponse = await openAIService.chatWithAI([
        {
          role: 'system',
          content: 'You are a content safety filter for a school. Only block social media and adult content. Allow news, blogs, and general web content.'
        },
        {
          role: 'user',
          content: filterPrompt
        }
      ]);

      console.log('🤖 AI filter response:', aiResponse);

      // Check if AI response indicates failure
      if (!aiResponse ||
          aiResponse.includes('unable to process') ||
          aiResponse.includes('apologize') ||
          aiResponse.includes('technical difficulties') ||
          aiResponse.length < 10) {
        console.warn('⚠️ AI returned error response, using basic domain filtering');
        return this.basicDomainFilter(resultSummary, userRole);
      }

      // Parse AI response to get safe results
      const safeResults = this.parseAIFilterResponse(aiResponse, resultSummary);

      // If AI parsing failed or returned no results, use domain filtering
      if (safeResults.length === 0) {
        console.warn('⚠️ AI filtering returned no results, using basic domain filtering as backup');
        return this.basicDomainFilter(resultSummary, userRole);
      }

      return safeResults;

    } catch (error) {
      console.warn('⚠️ AI filtering failed completely, applying basic domain filtering:', error);
      // Fallback to basic domain filtering if AI fails
      return this.basicDomainFilter(resultSummary);
    }
  }

  /**
   * Creates the AI prompt for filtering results
   */
  private static buildFilterPrompt(query: string, results: any[], userRole: string): string {
    return `Filter these search results for "${query}" for child safety at a school:

RESULTS:
${results.map(r => `${r.id}. ${r.title} (${r.domain})
   ${r.description}
   URL: ${r.url}`).join('\n\n')}

BLOCK ONLY:
- Social media platforms (Facebook, Twitter, Instagram, TikTok, Snapchat, Discord, Reddit)
- Adult content, nudity, bathing suits, inappropriate material
- Dating sites and mature relationship content
- Extreme violence or disturbing content

ALLOW (these are SAFE for children):
- News articles and blog posts
- Technology reviews and product information
- Educational content and reference sites
- General web content and legitimate information
- Shopping and commercial sites
- Entertainment and media content (that's not adult-oriented)

Return the IDs of ALL SAFE results as a comma-separated list (e.g., "1,2,3,4,5,6,7,8"). Most results should be allowed unless they specifically fall into the BLOCK categories above.`;
  }

  /**
   * Parses AI response to extract safe result IDs
   */
  private static parseAIFilterResponse(aiResponse: string, originalResults: any[]): SearchResult[] {
    try {
      // Extract numbers from AI response
      const safeIds = aiResponse.match(/\d+/g);

      if (!safeIds || aiResponse.toLowerCase().includes('none')) {
        console.log('🚫 AI determined no results are safe');
        return [];
      }

      const safeResults: SearchResult[] = [];

      safeIds.forEach(idStr => {
        const id = parseInt(idStr, 10);
        const result = originalResults.find(r => r.id === id);

        if (result) {
          safeResults.push({
            id: `web-${result.id}`,
            title: result.title,
            description: result.description,
            url: result.url,
            category: this.categorizeResult(result.domain, result.title),
            relevance: 0.9 - (safeResults.length * 0.1) // Decreasing relevance
          });
        }
      });

      return safeResults;
    } catch (error) {
      console.error('❌ Failed to parse AI filter response:', error);
      return [];
    }
  }

  /**
   * Basic domain filtering with different restrictions based on user role
   */
  private static basicDomainFilter(results: any[], userRole: 'guest' | 'student' | 'staff' = 'guest'): SearchResult[] {
    console.log('🛡️ Applying basic domain filtering to', results.length, 'results for', userRole);

    // Different filtering based on user role
    let blockedDomains: string[];

    if (userRole === 'staff') {
      // Staff have minimal restrictions - only block obvious harmful content
      blockedDomains = [
        'discord.com' // Only block Discord for staff
      ];
    } else {
      // Students and guests get stricter filtering
      blockedDomains = [
        'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'snapchat.com',
        'reddit.com', 'discord.com'
      ];
    }

    const filteredResults = results
      .filter(result => {
        const domain = result.domain.toLowerCase();
        const isBlocked = blockedDomains.some(blocked => domain.includes(blocked));

        if (isBlocked) {
          console.log('🚫 Blocked domain:', domain);
        }

        return !isBlocked;
      })
      .slice(0, 8) // Allow up to 8 results
      .map((result, index) => ({
        id: `web-${result.id}`,
        title: result.title,
        description: result.description,
        url: result.url,
        category: this.categorizeResult(result.domain, result.title),
        relevance: 0.9 - (index * 0.1)
      }));

    console.log('✅ Basic filtering passed', filteredResults.length, 'results');

    return filteredResults;
  }

  /**
   * Utility functions
   */

  private static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private static cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  private static categorizeResult(domain: string, title: string): string {
    const domainLower = domain.toLowerCase();
    const titleLower = title.toLowerCase();

    if (domainLower.includes('wikipedia') || domainLower.includes('britannica')) return 'Reference';
    if (domainLower.includes('khan') || domainLower.includes('edu')) return 'Educational';
    if (domainLower.includes('news') || domainLower.includes('bbc')) return 'News';
    if (titleLower.includes('tutorial') || titleLower.includes('how to')) return 'Tutorial';

    return 'General Information';
  }

  /**
   * Enhanced educational search - provides comprehensive subject-based results
   */
  private static getEducationalFallbacks(query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    console.log('📚 Generating educational results for query:', query);

    // AI/Technology queries
    if (queryLower.includes('ai') || queryLower.includes('artificial intelligence') ||
        queryLower.includes('machine learning') || queryLower.includes('models') ||
        queryLower.includes('chatgpt') || queryLower.includes('technology')) {
      return [
        {
          id: 'ai-1',
          title: 'Introduction to Artificial Intelligence for Students',
          description: 'Learn the basics of AI, machine learning, and how computers can be taught to think and learn.',
          url: 'https://www.khanacademy.org/computing/computer-science',
          category: 'Computer Science',
          relevance: 0.95
        },
        {
          id: 'ai-2',
          title: 'MIT Introduction to AI Course Materials',
          description: 'Educational materials explaining artificial intelligence concepts for students.',
          url: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/',
          category: 'Computer Science',
          relevance: 0.9
        },
        {
          id: 'ai-3',
          title: 'BBC Bitesize: Computer Science and AI',
          description: 'Student-friendly explanations of artificial intelligence and computer science concepts.',
          url: 'https://www.bbc.co.uk/bitesize/subjects/z34k7ty',
          category: 'Educational Technology',
          relevance: 0.85
        }
      ];
    }

    // Mathematics queries
    if (queryLower.includes('math') || queryLower.includes('algebra') ||
        queryLower.includes('geometry') || queryLower.includes('calculus') ||
        queryLower.includes('equation') || queryLower.includes('numbers')) {
      return [
        {
          id: 'math-1',
          title: 'Khan Academy Mathematics',
          description: 'Free online math courses covering algebra, geometry, calculus and more with practice exercises.',
          url: 'https://www.khanacademy.org/math',
          category: 'Mathematics',
          relevance: 0.95
        },
        {
          id: 'math-2',
          title: 'Math is Fun - Student Resources',
          description: 'Clear explanations of mathematical concepts with examples, games and interactive exercises.',
          url: 'https://www.mathsisfun.com',
          category: 'Mathematics',
          relevance: 0.9
        },
        {
          id: 'math-3',
          title: 'IXL Math Practice',
          description: 'Interactive math practice problems and explanations aligned with school curriculum.',
          url: 'https://www.ixl.com/math',
          category: 'Mathematics',
          relevance: 0.85
        }
      ];
    }

    // Science queries
    if (queryLower.includes('science') || queryLower.includes('biology') ||
        queryLower.includes('chemistry') || queryLower.includes('physics') ||
        queryLower.includes('photosynthesis') || queryLower.includes('atoms')) {
      return [
        {
          id: 'science-1',
          title: 'Khan Academy Science',
          description: 'Comprehensive science courses covering biology, chemistry, physics and earth science.',
          url: 'https://www.khanacademy.org/science',
          category: 'Science',
          relevance: 0.95
        },
        {
          id: 'science-2',
          title: 'NASA Education Resources',
          description: 'Space science, earth science, and STEM educational activities and resources.',
          url: 'https://www.nasa.gov/audience/foreducators',
          category: 'Science',
          relevance: 0.9
        },
        {
          id: 'science-3',
          title: 'National Geographic Kids Science',
          description: 'Fun science facts, experiments, and educational content about our world.',
          url: 'https://kids.nationalgeographic.com/science',
          category: 'Science',
          relevance: 0.85
        }
      ];
    }

    // History and Social Studies
    if (queryLower.includes('history') || queryLower.includes('historical') ||
        queryLower.includes('social') || queryLower.includes('geography') ||
        queryLower.includes('culture') || queryLower.includes('ancient')) {
      return [
        {
          id: 'history-1',
          title: 'National Geographic Kids History',
          description: 'Educational content about world history, cultures, and historical events for students.',
          url: 'https://kids.nationalgeographic.com/history',
          category: 'History',
          relevance: 0.95
        },
        {
          id: 'history-2',
          title: 'Britannica School Edition',
          description: 'Reliable encyclopedia articles on history and social studies topics.',
          url: 'https://school.britannica.com',
          category: 'History',
          relevance: 0.9
        },
        {
          id: 'history-3',
          title: 'Library of Congress Education',
          description: 'Primary sources and educational materials for learning about history.',
          url: 'https://www.loc.gov/education',
          category: 'History',
          relevance: 0.85
        }
      ];
    }

    // English and Literature
    if (queryLower.includes('english') || queryLower.includes('reading') ||
        queryLower.includes('writing') || queryLower.includes('literature') ||
        queryLower.includes('grammar') || queryLower.includes('vocabulary')) {
      return [
        {
          id: 'english-1',
          title: 'ReadWorks - Reading Comprehension',
          description: 'Reading comprehension passages and activities for all grade levels.',
          url: 'https://www.readworks.org',
          category: 'English Language Arts',
          relevance: 0.95
        },
        {
          id: 'english-2',
          title: 'Purdue Writing Lab',
          description: 'Comprehensive writing resources, grammar guides, and citation help.',
          url: 'https://owl.purdue.edu',
          category: 'English Language Arts',
          relevance: 0.9
        },
        {
          id: 'english-3',
          title: 'Poetry Foundation Learning Center',
          description: 'Educational poetry resources and literary analysis tools for students.',
          url: 'https://www.poetryfoundation.org/learn',
          category: 'English Language Arts',
          relevance: 0.85
        }
      ];
    }

    // General educational search - create topic-specific results
    const topicSpecificResults = this.generateTopicSpecificResults(query);
    if (topicSpecificResults.length > 0) {
      return topicSpecificResults;
    }

    // Ultimate fallback - general educational resources
    return [
      {
        id: 'general-1',
        title: `Educational Resources for "${query}"`,
        description: 'Explore comprehensive learning materials and educational content on this topic.',
        url: 'https://www.khanacademy.org/search?page_search_query=' + encodeURIComponent(query),
        category: 'Educational Resources',
        relevance: 0.9
      },
      {
        id: 'general-2',
        title: `Encyclopedia Information: ${query}`,
        description: 'Access reliable reference materials and encyclopedia articles about this topic.',
        url: 'https://www.britannica.com/search?query=' + encodeURIComponent(query),
        category: 'Reference Materials',
        relevance: 0.85
      },
      {
        id: 'general-3',
        title: `Educational Videos: ${query}`,
        description: 'Watch educational videos and tutorials about this subject.',
        url: 'https://www.khanacademy.org',
        category: 'Video Learning',
        relevance: 0.8
      }
    ];
  }

  /**
   * Generates topic-specific educational results
   */
  private static generateTopicSpecificResults(query: string): SearchResult[] {
    const queryWords = query.toLowerCase().split(' ');
    const educationalKeywords = ['learn', 'study', 'understand', 'explain', 'how', 'what', 'why', 'difference', 'compare'];

    // Check if this seems like an educational query
    const isEducationalQuery = queryWords.some(word => educationalKeywords.includes(word));

    if (isEducationalQuery) {
      return [
        {
          id: 'topic-1',
          title: `Learn About: ${this.capitalizeWords(query)}`,
          description: `Comprehensive educational materials and resources for understanding ${query}.`,
          url: 'https://www.khanacademy.org/search?page_search_query=' + encodeURIComponent(query),
          category: 'Educational Content',
          relevance: 0.9
        },
        {
          id: 'topic-2',
          title: `Study Guide: ${this.capitalizeWords(query)}`,
          description: `Study materials, explanations and practice exercises for ${query}.`,
          url: 'https://www.britannica.com/search?query=' + encodeURIComponent(query),
          category: 'Study Materials',
          relevance: 0.85
        }
      ];
    }

    return [];
  }

  /**
   * Capitalizes first letter of each word
   */
  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }
}