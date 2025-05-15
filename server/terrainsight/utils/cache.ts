/**
 * Simple in-memory caching utility for API responses
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * A simple in-memory cache for API responses
 */
class ResponseCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTtlMs: number;
  
  /**
   * Creates a new response cache
   * @param defaultTtlMs Default time-to-live for cache entries in milliseconds
   */
  constructor(defaultTtlMs: number = 1000 * 60 * 60) { // Default: 1 hour
    this.defaultTtlMs = defaultTtlMs;
    
    // Clean up expired entries periodically (every 5 minutes)
    setInterval(() => this.cleanupExpiredEntries(), 1000 * 60 * 5);
  }
  
  /**
   * Gets a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Sets a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttlMs Optional TTL in milliseconds (defaults to constructor value)
   */
  set(key: string, value: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTtlMs);
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Removes a value from the cache
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Gets the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Removes all expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Alternative approach to avoid TypeScript iterator issues
    this.cache.forEach((entry, key) => {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    });
  }
  
  /**
   * Gets a value from the cache using the provided function if not cached
   * @param key The cache key
   * @param fn Function to call if the key is not in the cache
   * @param ttlMs Optional TTL in milliseconds
   * @returns The cached or newly generated value
   */
  async getOrSet(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cachedValue = this.get(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Value not in cache, generate it
    const newValue = await fn();
    this.set(key, newValue, ttlMs);
    return newValue;
  }
}

// Export a singleton instance for OpenAI responses
export const openAICache = new ResponseCache<any>(1000 * 60 * 60 * 24); // 24-hour cache

/**
 * Generates a cache key for OpenAI data quality analysis
 */
export function generateDataQualityAnalysisKey(
  dataSourceName: string,
  dataSourceType: string,
  dataSample: { columns: string[], rows: any[][] },
  existingIssues: any[]
): string {
  // Create a simplified representation of the data for the cache key
  const simplifiedData = {
    name: dataSourceName,
    type: dataSourceType,
    columns: dataSample.columns,
    // Use only the first few rows to keep the key manageable
    sampleRows: dataSample.rows.slice(0, 2),
    // Create a summary of issues to avoid long cache keys
    issueCount: existingIssues.length,
    issueTypes: existingIssues.map(issue => `${issue.field}:${issue.severity}`).join(',')
  };
  
  // Create a string hash of the simplified data
  return JSON.stringify(simplifiedData);
}