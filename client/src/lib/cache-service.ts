/**
 * Client-side Cache Service
 * Provides efficient data caching for the TerraFusionPro frontend
 */

type CacheItem<T> = {
  data: T;
  expiry: number;
  lastAccessed: number;
};

interface CacheOptions {
  maxItems?: number;
  defaultTTL?: number; // Time to live in milliseconds
}

export class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private maxItems: number;
  private defaultTTL: number;
  
  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxItems = options.maxItems || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes by default
    
    // Set up automatic cleanup
    setInterval(() => this.cleanup(), 60 * 1000); // Run cleanup every minute
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Update last accessed time
    item.lastAccessed = Date.now();
    
    return item.data;
  }
  
  /**
   * Store an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not specified)
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    // Make room if cache is full
    if (this.cache.size >= this.maxItems) {
      this.evictLeastRecentlyUsed();
    }
    
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      expiry,
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Remove an item from the cache
   * @param key Cache key
   * @returns true if item was found and removed, false otherwise
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Check if an item exists in the cache and is not expired
   * @param key Cache key
   * @returns true if item exists and is not expired, false otherwise
   */
  public has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the number of items in the cache
   */
  public size(): number {
    return this.cache.size;
  }
  
  /**
   * Refresh the expiry time of an item
   * @param key Cache key
   * @param ttl New time to live in milliseconds (optional, uses default if not specified)
   * @returns true if item was found and refreshed, false otherwise
   */
  public refresh(key: string, ttl?: number): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    item.expiry = Date.now() + (ttl || this.defaultTTL);
    item.lastAccessed = Date.now();
    
    return true;
  }
  
  /**
   * Remove expired items from the cache
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Evict the least recently used item from the cache
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Create and export a default instance
export const cacheService = new CacheService();

// Cache hook for React components
export function useCacheService(): CacheService {
  return cacheService;
}
