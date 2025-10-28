import type { AppConfig } from '../config/app-config';
import { getConfig } from '../config/app-config';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class OpenAIService {
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private config: AppConfig | null = null;
  private apiDisabled = false;

  private async ensureConfig(): Promise<AppConfig> {
    if (!this.config) {
      this.config = await getConfig();
    }
    return this.config;
  }

  async searchWithAI(query: string, userRole: 'guest' | 'student' | 'staff'): Promise<SearchResult[]> {
    console.log('🔍 Search initiated:', { query, userRole, apiDisabled: this.apiDisabled });

    // Use new web search + AI filtering approach for real search results
    console.log('🌐 Using DuckDuckGo + AI filtering for real search results');
    const { WebSearchService } = await import('./webSearchService');
    return WebSearchService.searchWeb(query, userRole);
  }

  async chatWithAI(messages: ChatMessage[], maxTokens?: number): Promise<string> {
    console.log('🤖 ChatWithAI called:', { 
      messagesCount: messages.length, 
      maxTokens, 
      apiDisabled: this.apiDisabled 
    });

    // If API is disabled due to previous errors, return fallback message
    if (this.apiDisabled) {
      console.log('🚫 API disabled, returning fallback message');
      return 'I apologize, but AI chat is currently unavailable. The service will use mock data for search results instead.';
    }

    try {
      const config = await this.ensureConfig();
      console.log('🔑 API Key status:', { 
        hasKey: !!config.openAi.apiKey, 
        keyLength: config.openAi.apiKey?.length || 0,
        model: config.openAi.model 
      });

      // Check if API key is properly configured
      if (!config.openAi.apiKey || config.openAi.apiKey === 'your-openai-api-key-here' || config.openAi.apiKey.length < 10) {
        console.log('❌ API key not configured properly');
        this.apiDisabled = true;
        return 'I apologize, but AI chat is not properly configured. Please check your OpenAI API settings.';
      }

      // Use a simpler system prompt for instant answers
      const systemMessage: ChatMessage = {
        role: 'system',
        content: 'You are a helpful assistant. Provide clear, accurate answers based on the information provided.'
      };

      console.log('📤 Calling OpenAI with messages:', messages.length);
      console.log('📤 Messages being sent:', messages.map(m => ({ role: m.role, contentLength: m.content.length })));
      const response = await this.callOpenAI([systemMessage, ...messages], maxTokens);
      console.log('📨 Full OpenAI response:', response);
      console.log('📨 OpenAI response received:', { 
        hasContent: !!response.choices?.[0]?.message?.content,
        contentLength: response.choices?.[0]?.message?.content?.length || 0,
        actualContent: response.choices?.[0]?.message?.content
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log('⚠️ Empty content from OpenAI - full response:', JSON.stringify(response, null, 2));
        return 'I apologize, but I was unable to process your request at this time.';
      }

      return content;
    } catch (error: unknown) {
      console.error('❌ AI Chat failed:', error);

      // Provide specific error messages based on error type
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('timeout')) {
        return 'I apologize, but the AI service is taking longer than expected to respond. This might be due to high demand. Please try asking your question again, or try a shorter, more specific question.';
      } else if (errorMessage.includes('network')) {
        return 'I\'m having trouble connecting to the AI service right now. Please check your internet connection and try again.';
      } else {
        return 'I apologize, but I am experiencing technical difficulties with the AI service. Please try again later or contact IT support if this issue persists.';
      }
    }
  }

  private async callOpenAI(messages: ChatMessage[], maxTokens?: number): Promise<OpenAIResponse> {
    const config = await this.ensureConfig();

    // Check if API key is configured
    if (!config.openAi.apiKey || config.openAi.apiKey === 'your-openai-api-key-here') {
      console.warn('OpenAI API key not configured, using fallback results');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model: config.openAi.model,
      messages,
      max_completion_tokens: maxTokens || 2000 // Increased for o1/o3 models with reasoning tokens
    };

    // Create a timeout promise to prevent long waits
    // Increased to 30 seconds for reasoning models (o1/o3/gpt-5-nano) which need more time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - AI response taking too long')), 30000); // 30 second timeout
    });

    const fetchPromise = fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openAi.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        model: config.openAi.model,
        requestBody
      });
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }



  private buildDirectSearchPrompt(query: string, userRole: 'guest' | 'student' | 'staff'): string {
    return `JSON array of 3 results for "${query}":`;
  }



  private parseSearchResults(response: OpenAIResponse): SearchResult[] {
    try {
      const content = response.choices[0]?.message?.content;
      console.log('📝 OpenAI Response content:', content);

      if (!content || content.trim().length === 0) {
        console.warn('⚠️ No content in OpenAI response - response structure:', JSON.stringify(response, null, 2));
        return [];
      }

      // Clean the content and look for JSON array
      const cleanContent = content.trim();

      // Try to find JSON array in various formats
      let jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        // Try to find if it's wrapped in code blocks
        jsonMatch = cleanContent.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1]; // Use the captured group
        }
      }

      if (!jsonMatch) {
        console.warn('⚠️ No JSON array found in response. Full content:', cleanContent);
        // Check if it's a refusal or explanation
        if (cleanContent.toLowerCase().includes('cannot') || cleanContent.toLowerCase().includes('sorry') || cleanContent.toLowerCase().includes('unable')) {
          console.warn('⚠️ AI refused to generate results');
        }
        return [];
      }

      console.log('📋 Extracted JSON:', jsonMatch[0]);
      const results = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(results)) {
        console.warn('⚠️ Parsed result is not an array:', results);
        return [];
      }

      // Validate each result has required fields
      const validResults = results.filter(result =>
        result.id && result.title && result.description && result.url && result.category
      );

      if (validResults.length !== results.length) {
        console.warn('⚠️ Some results missing required fields. Valid:', validResults.length, 'Total:', results.length);
      }

      return validResults;
    } catch (error: unknown) {
      console.error('❌ Failed to parse AI search results:', error);
      console.error('❌ Raw response:', JSON.stringify(response, null, 2));
      return [];
    }
  }



  private getEducationalFallbacks(query: string, userRole: 'guest' | 'student' | 'staff'): SearchResult[] {
    const queryLower = query.toLowerCase();

    // Educational fallbacks based on query content
    if (queryLower.includes('math') || queryLower.includes('algebra') || queryLower.includes('geometry') || queryLower.includes('calculus')) {
      return [
        {
          id: 'math-1',
          title: 'Khan Academy Math',
          description: 'Free online math courses and practice exercises covering all grade levels.',
          url: 'https://www.khanacademy.org/math',
          category: 'Mathematics'
        },
        {
          id: 'math-2',
          title: 'IXL Math Practice',
          description: 'Interactive math practice problems aligned with curriculum standards.',
          url: 'https://www.ixl.com/math',
          category: 'Mathematics'
        },
        {
          id: 'math-3',
          title: 'Math is Fun',
          description: 'Simple, clear explanations of mathematical concepts and formulas.',
          url: 'https://www.mathsisfun.com',
          category: 'Mathematics'
        }
      ];
    }

    if (queryLower.includes('science') || queryLower.includes('biology') || queryLower.includes('chemistry') || queryLower.includes('physics')) {
      return [
        {
          id: 'science-1',
          title: 'Khan Academy Science',
          description: 'Comprehensive science courses covering biology, chemistry, and physics.',
          url: 'https://www.khanacademy.org/science',
          category: 'Science'
        },
        {
          id: 'science-2',
          title: 'NASA Education',
          description: 'Educational resources about space, Earth science, and STEM activities.',
          url: 'https://www.nasa.gov/audience/foreducators',
          category: 'Science'
        },
        {
          id: 'science-3',
          title: 'Smithsonian National Museum',
          description: 'Educational materials and virtual exhibits on natural history.',
          url: 'https://naturalhistory.si.edu/education',
          category: 'Science'
        }
      ];
    }

    if (queryLower.includes('history') || queryLower.includes('social') || queryLower.includes('geography')) {
      return [
        {
          id: 'history-1',
          title: 'National Geographic Kids',
          description: 'Educational content about world cultures, history, and geography.',
          url: 'https://kids.nationalgeographic.com',
          category: 'Social Studies'
        },
        {
          id: 'history-2',
          title: 'Britannica School',
          description: 'Reliable encyclopedia articles on history and social studies topics.',
          url: 'https://school.britannica.com',
          category: 'Social Studies'
        },
        {
          id: 'history-3',
          title: 'Library of Congress Education',
          description: 'Primary sources and educational materials for history studies.',
          url: 'https://www.loc.gov/education',
          category: 'Social Studies'
        }
      ];
    }

    if (queryLower.includes('english') || queryLower.includes('reading') || queryLower.includes('writing') || queryLower.includes('literature')) {
      return [
        {
          id: 'english-1',
          title: 'ReadWorks',
          description: 'Reading comprehension passages and activities for all grade levels.',
          url: 'https://www.readworks.org',
          category: 'English Language Arts'
        },
        {
          id: 'english-2',
          title: 'Purdue Writing Lab',
          description: 'Comprehensive writing resources and grammar guides.',
          url: 'https://owl.purdue.edu',
          category: 'English Language Arts'
        },
        {
          id: 'english-3',
          title: 'Poetry Foundation',
          description: 'Educational poetry resources and literary analysis tools.',
          url: 'https://www.poetryfoundation.org/learn',
          category: 'English Language Arts'
        }
      ];
    }

    // General educational fallbacks
    return [
      {
        id: 'general-1',
        title: `Educational Resources for "${query}"`,
        description: 'Explore comprehensive learning materials and educational content.',
        url: 'https://www.khanacademy.org',
        category: 'Educational Resources'
      },
      {
        id: 'general-2',
        title: `Study Materials: ${query}`,
        description: 'Access reliable reference materials and study guides.',
        url: 'https://www.britannica.com',
        category: 'Reference Materials'
      },
      {
        id: 'general-3',
        title: `Learning Tools for ${query}`,
        description: 'Interactive educational tools and practice exercises.',
        url: 'https://www.ixl.com',
        category: 'Learning Tools'
      }
    ];
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const openAIService = new OpenAIService();