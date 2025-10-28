/**
 * In-memory caching service for AI responses
 * Provides fast response times for repeated queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum number of cached entries
  private defaultTTL = 15 * 60 * 1000; // 15 minutes in milliseconds (increased to reduce API usage)

  /**
   * Generate cache key from query and user role
   */
  private generateKey(query: string, userRole?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    return userRole ? `${normalizedQuery}:${userRole}` : normalizedQuery;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict oldest entries if cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // Remove 20% of oldest entries
      const entriesToRemove = Math.floor(this.maxSize * 0.2);
      const entries: [string, CacheEntry<any>][] = [];

      this.cache.forEach((entry, key) => {
        entries.push([key, entry]);
      });

      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (let i = 0; i < entriesToRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get cached data if available and valid
   */
  get<T>(query: string, userRole?: string): T | null {
    const key = this.generateKey(query, userRole);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    console.log('🎯 Cache HIT for query:', query);
    return entry.data;
  }

  /**
   * Store data in cache
   */
  set<T>(query: string, data: T, userRole?: string, ttl?: number): void {
    this.cleanup();
    this.evictIfNeeded();

    const key = this.generateKey(query, userRole);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    console.log('💾 Cache SET for query:', query, '(TTL:', (ttl || this.defaultTTL) / 1000, 'seconds)');
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need hit/miss counters for accurate stats
    };
  }

  /**
   * Check if query exists in cache
   */
  has(query: string, userRole?: string): boolean {
    const key = this.generateKey(query, userRole);
    const entry = this.cache.get(key);
    return entry ? this.isValid(entry) : false;
  }

  /**
   * Remove specific entry from cache
   */
  delete(query: string, userRole?: string): boolean {
    const key = this.generateKey(query, userRole);
    return this.cache.delete(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();