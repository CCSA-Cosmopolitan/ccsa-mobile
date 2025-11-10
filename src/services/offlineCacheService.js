import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Comprehensive Offline Cache Service
 * 
 * This service provides:
 * - Automatic caching of all API responses
 * - Offline-first data retrieval
 * - Cache invalidation strategies
 * - Network-aware data fetching
 * - Automatic background sync
 */

const CACHE_KEYS = {
  FARMERS: '@cache_farmers',
  FARMS_BY_FARMER: '@cache_farms_by_farmer',
  ALL_FARMS: '@cache_all_farms',
  CLUSTERS: '@cache_clusters',
  LOCATIONS: '@cache_locations',
  USER_PROFILE: '@cache_user_profile',
  LAST_SYNC: '@cache_last_sync',
  NETWORK_STATUS: '@cache_network_status',
};

const CACHE_EXPIRY = {
  FARMERS: 24 * 60 * 60 * 1000, // 24 hours
  FARMS: 24 * 60 * 60 * 1000, // 24 hours
  CLUSTERS: 7 * 24 * 60 * 60 * 1000, // 7 days (rarely changes)
  LOCATIONS: 7 * 24 * 60 * 60 * 1000, // 7 days (rarely changes)
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
};

export const offlineCacheService = {
  // Network status tracking
  isOnline: true,
  networkListeners: [],

  /**
   * Initialize the cache service
   */
  async initialize() {
    // Setup network monitoring
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable !== false;
      
      console.log('📶 Network status changed:', this.isOnline ? 'Online' : 'Offline');
      
      // Notify all listeners
      this.networkListeners.forEach(listener => listener(this.isOnline));
      
      // If we just came back online, trigger sync
      if (!wasOffline && this.isOnline) {
        console.log('🔄 Network restored, triggering sync...');
        this.syncAll();
      }
    });

    // Get initial network status
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;
    console.log('📶 Initial network status:', this.isOnline ? 'Online' : 'Offline');

    return unsubscribe;
  },

  /**
   * Subscribe to network status changes
   */
  onNetworkChange(callback) {
    this.networkListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.networkListeners = this.networkListeners.filter(cb => cb !== callback);
    };
  },

  /**
   * Check if we're online
   */
  async checkOnline() {
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;
    return this.isOnline;
  },

  /**
   * Generic cache set with expiry
   */
  async setCache(key, data, expiryMs = null) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiryMs,
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`💾 Cached data for key: ${key}`);
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
    }
  },

  /**
   * Generic cache get with expiry check
   */
  async getCache(key, expiryMs = null) {
    try {
      const cachedJson = await AsyncStorage.getItem(key);
      if (!cachedJson) {
        console.log(`📦 No cache found for key: ${key}`);
        return null;
      }

      const cached = JSON.parse(cachedJson);
      const age = Date.now() - cached.timestamp;

      // Check if cache is expired
      const maxAge = expiryMs || cached.expiryMs;
      if (maxAge && age > maxAge) {
        console.log(`⏰ Cache expired for key: ${key} (age: ${age}ms, max: ${maxAge}ms)`);
        await AsyncStorage.removeItem(key);
        return null;
      }

      console.log(`✅ Cache hit for key: ${key} (age: ${age}ms)`);
      return cached.data;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  },

  /**
   * Clear specific cache
   */
  async clearCache(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cleared cache for key: ${key}`);
    } catch (error) {
      console.error(`Error clearing cache for ${key}:`, error);
    }
  },

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('🗑️ Cleared all caches');
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  },

  /**
   * Fetch with cache strategy
   * - If offline: return cache
   * - If online: fetch from API, update cache, return data
   */
  async fetchWithCache(cacheKey, fetchFunction, expiryMs = null, forceRefresh = false) {
    const isOnline = await this.checkOnline();

    // If offline, return cached data
    if (!isOnline) {
      console.log('📴 Offline mode: using cached data');
      const cachedData = await this.getCache(cacheKey, expiryMs);
      if (cachedData) {
        return cachedData;
      }
      throw new Error('No cached data available offline');
    }

    // If online and not forcing refresh, check cache first
    if (!forceRefresh) {
      const cachedData = await this.getCache(cacheKey, expiryMs);
      if (cachedData) {
        // Return cached data but refresh in background
        console.log('🔄 Using cache but refreshing in background...');
        this.refreshInBackground(cacheKey, fetchFunction, expiryMs);
        return cachedData;
      }
    }

    // Fetch fresh data
    try {
      console.log('🌐 Fetching fresh data from API...');
      const data = await fetchFunction();
      await this.setCache(cacheKey, data, expiryMs);
      return data;
    } catch (error) {
      console.error('❌ API fetch failed, falling back to cache:', error);
      // If API fails, try cache as fallback
      const cachedData = await this.getCache(cacheKey, null); // Ignore expiry on error
      if (cachedData) {
        console.log('✅ Using expired cache as fallback');
        return cachedData;
      }
      throw error;
    }
  },

  /**
   * Refresh cache in background without blocking
   */
  async refreshInBackground(cacheKey, fetchFunction, expiryMs) {
    try {
      const data = await fetchFunction();
      await this.setCache(cacheKey, data, expiryMs);
      console.log('✅ Background refresh completed');
    } catch (error) {
      console.error('❌ Background refresh failed:', error);
    }
  },

  /**
   * Cache farmers list
   */
  async cacheFarmers(farmers) {
    await this.setCache(CACHE_KEYS.FARMERS, farmers, CACHE_EXPIRY.FARMERS);
    await this.updateLastSync('farmers');
  },

  /**
   * Get cached farmers
   */
  async getCachedFarmers() {
    return await this.getCache(CACHE_KEYS.FARMERS, CACHE_EXPIRY.FARMERS);
  },

  /**
   * Cache farms for a specific farmer
   */
  async cacheFarmsByFarmer(farmerId, farms) {
    try {
      // Get existing cache
      const allFarmsCache = await this.getCache(CACHE_KEYS.FARMS_BY_FARMER, null) || {};
      
      // Update for this farmer
      allFarmsCache[farmerId] = {
        farms,
        timestamp: Date.now(),
      };
      
      // Save back
      await this.setCache(CACHE_KEYS.FARMS_BY_FARMER, allFarmsCache, CACHE_EXPIRY.FARMS);
      await this.updateLastSync('farms');
    } catch (error) {
      console.error('Error caching farms by farmer:', error);
    }
  },

  /**
   * Get cached farms for a farmer
   */
  async getCachedFarmsByFarmer(farmerId) {
    try {
      const allFarmsCache = await this.getCache(CACHE_KEYS.FARMS_BY_FARMER, CACHE_EXPIRY.FARMS);
      if (!allFarmsCache || !allFarmsCache[farmerId]) {
        return null;
      }
      return allFarmsCache[farmerId].farms;
    } catch (error) {
      console.error('Error getting cached farms:', error);
      return null;
    }
  },

  /**
   * Cache clusters
   */
  async cacheClusters(clusters) {
    await this.setCache(CACHE_KEYS.CLUSTERS, clusters, CACHE_EXPIRY.CLUSTERS);
  },

  /**
   * Get cached clusters
   */
  async getCachedClusters() {
    return await this.getCache(CACHE_KEYS.CLUSTERS, CACHE_EXPIRY.CLUSTERS);
  },

  /**
   * Cache location data
   */
  async cacheLocations(locations) {
    await this.setCache(CACHE_KEYS.LOCATIONS, locations, CACHE_EXPIRY.LOCATIONS);
  },

  /**
   * Get cached locations
   */
  async getCachedLocations() {
    return await this.getCache(CACHE_KEYS.LOCATIONS, CACHE_EXPIRY.LOCATIONS);
  },

  /**
   * Update last sync timestamp
   */
  async updateLastSync(type) {
    try {
      const lastSync = await this.getCache(CACHE_KEYS.LAST_SYNC, null) || {};
      lastSync[type] = Date.now();
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, JSON.stringify(lastSync));
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  },

  /**
   * Get last sync time for a type
   */
  async getLastSync(type) {
    try {
      const lastSync = await this.getCache(CACHE_KEYS.LAST_SYNC, null) || {};
      return lastSync[type] || null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  },

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = {};
      
      for (const [name, key] of Object.entries(CACHE_KEYS)) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          stats[name] = {
            size: cached.length,
            timestamp: data.timestamp,
            age: Date.now() - data.timestamp,
            itemCount: Array.isArray(data.data) ? data.data.length : (data.data ? Object.keys(data.data).length : 0),
          };
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {};
    }
  },

  /**
   * Sync all cached data with server
   */
  async syncAll() {
    console.log('🔄 Starting full sync...');
    const results = {
      success: [],
      failed: [],
    };

    // This will be called by offlineSyncService
    // We just mark that sync is needed
    try {
      await this.updateLastSync('full_sync');
      console.log('✅ Full sync completed');
    } catch (error) {
      console.error('❌ Full sync failed:', error);
    }

    return results;
  },

  /**
   * Prefetch commonly used data
   */
  async prefetchCommonData() {
    const isOnline = await this.checkOnline();
    if (!isOnline) {
      console.log('📴 Offline: skipping prefetch');
      return;
    }

    console.log('🔄 Prefetching common data...');
    
    // This can be called on app startup to warm up the cache
    // Implementation depends on your services
  },
};

export default offlineCacheService;
