/**
 * Simple GitLab Cache Implementation
 * Replaces the deleted gitlab-wrapper cache functionality
 */

class GitLabCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 300; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    this.keyPrefix = options.keyPrefix || '';
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Set a value in the cache
   */
  async set(key, value, customTtl = null) {
    try {
      const ttl = customTtl || this.ttl;
      const expiresAt = Date.now() + (ttl * 1000);
      
      const cacheKey = this.keyPrefix + key;
      
      // If cache is at max size, remove oldest entry
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(cacheKey, {
        value,
        expiresAt,
        createdAt: Date.now()
      });
      
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get a value from the cache
   */
  async get(key) {
    try {
      const cacheKey = this.keyPrefix + key;
      const item = this.cache.get(cacheKey);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }
      
      // Check if expired
      if (Date.now() > item.expiresAt) {
        this.cache.delete(cacheKey);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return item.value;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   */
  async delete(key) {
    try {
      const cacheKey = this.keyPrefix + key;
      const deleted = this.cache.delete(cacheKey);
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Get all cache keys
   */
  async getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Clear all cache
   */
  async clear() {
    this.cache.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0.00%',
      size: this.cache.size
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

export { GitLabCache };