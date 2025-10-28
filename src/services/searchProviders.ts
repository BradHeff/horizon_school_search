/**
 * Multi-Provider Search Fallback System
 * Provides reliable search with automatic fallback to multiple free APIs
 *
 * Provider Priority:
 * 1. LangSearch (primary) - Free tier available
 * 2. Brave Search API - 2,000 free queries/month
 * 3. DuckDuckGo HTML Scraping - Unlimited, free
 * 4. SearXNG Public Instance - Unlimited, free
 */

export interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
  datePublished?: string;
}

export interface SearchProvider {
  name: string;
  search(query: string, count?: number): Promise<RawSearchResult[]>;
  isAvailable(): Promise<boolean>;
}

/**
 * LangSearch Provider (Primary)
 */
export class LangSearchProvider implements SearchProvider {
  name = 'LangSearch';
  private apiKey: string;
  private baseUrl = 'https://api.langsearch.com/v1/web-search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    // Quick availability check - just verify we have an API key
    return !!this.apiKey;
  }

  async search(query: string, count: number = 8): Promise<RawSearchResult[]> {
    console.log('🔍 Fetching from LangSearch:', this.baseUrl);

    const requestBody = {
      query,
      freshness: 'noLimit',
      summary: false,
      count
    };

    console.log('📤 LangSearch request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LangSearch API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Total LangSearch results collected:', data.data?.webPages?.value?.length || 0);

    const results = data.data?.webPages?.value || [];
    return results.map((result: any) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      domain: new URL(result.url).hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=32`,
      datePublished: result.datePublished
    }));
  }
}

/**
 * Brave Search API Provider (Fallback 1)
 * Free tier: 2,000 queries/month, no credit card required
 * Sign up: https://brave.com/search/api/
 */
export class BraveSearchProvider implements SearchProvider {
  name = 'Brave Search';
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async search(query: string, count: number = 8): Promise<RawSearchResult[]> {
    console.log('🦁 Fetching from Brave Search API');

    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      text_decorations: 'false',
      search_lang: 'en'
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': this.apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brave Search API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Brave Search results:', data.web?.results?.length || 0);

    const results = data.web?.results || [];
    return results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      domain: new URL(result.url).hostname,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=32`,
      datePublished: result.age
    }));
  }
}

/**
 * DuckDuckGo HTML Scraping Provider (Fallback 2)
 * Completely free, unlimited - scrapes HTML results
 */
export class DuckDuckGoProvider implements SearchProvider {
  name = 'DuckDuckGo';
  private baseUrl = 'https://html.duckduckgo.com/html/';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async search(query: string, count: number = 8): Promise<RawSearchResult[]> {
    console.log('🦆 Fetching from DuckDuckGo HTML');

    const formData = new URLSearchParams({
      q: query,
      kl: 'us-en'
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo error: ${response.status}`);
    }

    const html = await response.text();
    return this.parseResults(html, count);
  }

  private parseResults(html: string, maxResults: number): RawSearchResult[] {
    const results: RawSearchResult[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const resultDivs = doc.querySelectorAll('.result');

    for (let i = 0; i < Math.min(resultDivs.length, maxResults); i++) {
      const resultDiv = resultDivs[i];

      const titleElement = resultDiv.querySelector('.result__a');
      const snippetElement = resultDiv.querySelector('.result__snippet');
      const urlElement = resultDiv.querySelector('.result__url');

      if (titleElement && urlElement) {
        try {
          const url = urlElement.getAttribute('href') || '';
          const domain = new URL(url).hostname;

          results.push({
            title: titleElement.textContent?.trim() || '',
            url: url,
            snippet: snippetElement?.textContent?.trim() || '',
            domain: domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
          });
        } catch (e) {
          // Skip invalid URLs
          continue;
        }
      }
    }

    console.log('📊 DuckDuckGo results:', results.length);
    return results;
  }
}

/**
 * SearXNG Public Instance Provider (Fallback 3)
 * Free, unlimited - uses public SearXNG instances
 */
export class SearXNGProvider implements SearchProvider {
  name = 'SearXNG';
  private instances = [
    'https://searx.be',
    'https://searx.work',
    'https://search.bus-hit.me',
  ];
  private currentInstance = 0;

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async search(query: string, count: number = 8): Promise<RawSearchResult[]> {
    const instance = this.instances[this.currentInstance];
    console.log(`🔍 Fetching from SearXNG: ${instance}`);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        categories: 'general',
        language: 'en'
      });

      const response = await fetch(`${instance}/search?${params}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SearXNG error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 SearXNG results:', data.results?.length || 0);

      const results = (data.results || []).slice(0, count);
      return results.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.content || result.title,
        domain: new URL(result.url).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=32`,
        datePublished: result.publishedDate
      }));
    } catch (error) {
      // Try next instance on failure
      this.currentInstance = (this.currentInstance + 1) % this.instances.length;
      throw error;
    }
  }
}

/**
 * Fallback Manager - Tries providers in order until one succeeds
 */
export class SearchFallbackManager {
  private providers: SearchProvider[] = [];

  addProvider(provider: SearchProvider) {
    this.providers.push(provider);
  }

  async search(query: string, count: number = 8): Promise<RawSearchResult[]> {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`⏭️ Skipping ${provider.name} - not available`);
          continue;
        }

        console.log(`🔄 Trying ${provider.name}...`);
        const results = await provider.search(query, count);

        if (results && results.length > 0) {
          console.log(`✅ ${provider.name} succeeded with ${results.length} results`);
          return results;
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.warn(`⚠️ ${provider.name} failed:`, errorMsg);
        errors.push({ provider: provider.name, error: errorMsg });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const errorSummary = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new Error(`All search providers failed: ${errorSummary}`);
  }

  getProviderNames(): string[] {
    return this.providers.map(p => p.name);
  }
}
