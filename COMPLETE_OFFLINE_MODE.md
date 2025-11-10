# Complete Offline Mode Implementation

## Overview

The CCSA Mobile app now features a **comprehensive offline mode** that allows users to:
- ✅ View farmers and farms without network connectivity
- ✅ Add new farms while offline (synced automatically when online)
- ✅ Navigate through the app seamlessly
- ✅ Get visual feedback about network status
- ⚠️ **NIN validation still requires network** (external API dependency)

## Architecture

### 1. **Offline Cache Service** (`offlineCacheService.js`)

The central caching layer that handles all data persistence and retrieval.

#### Key Features:
- **Automatic caching** of all API responses
- **Cache expiry management** (24h for farmers/farms, 7 days for static data)
- **Offline-first strategy**: Check cache first, fetch from API in background
- **Network monitoring**: Auto-detects connection changes
- **Cache statistics**: Track cache size, age, and items

#### Cache Keys:
```javascript
{
  FARMERS: '@cache_farmers',
  FARMS_BY_FARMER: '@cache_farms_by_farmer',
  CLUSTERS: '@cache_clusters',
  LOCATIONS: '@cache_locations',
  USER_PROFILE: '@cache_user_profile',
  LAST_SYNC: '@cache_last_sync',
}
```

#### Usage Example:
```javascript
import { offlineCacheService } from '../services/offlineCacheService';

// Fetch with automatic caching
const farmers = await offlineCacheService.fetchWithCache(
  '@cache_farmers',
  async () => await farmerService.getFarmers(1, 1000),
  24 * 60 * 60 * 1000, // 24 hour expiry
  false // forceRefresh
);

// Check network status
const isOnline = await offlineCacheService.checkOnline();

// Subscribe to network changes
const unsubscribe = offlineCacheService.onNetworkChange((isOnline) => {
  console.log('Network status:', isOnline ? 'Online' : 'Offline');
});
```

### 2. **Offline Sync Service** (`offlineSyncService.js`)

Handles queuing and syncing of operations performed while offline.

#### Key Features:
- **Queue management** for offline farms and operations
- **Automatic sync** when network is restored
- **Retry logic** for failed syncs
- **Operation types**: Create, Update, Delete
- **Entity types**: Farmers, Farms

#### Offline Operations:
```javascript
// Save farm offline
const offlineFarm = await offlineSyncService.saveFarmOffline(
  farmerId,
  farmData,
  farmer
);

// Save generic operation
await offlineSyncService.saveOfflineOperation(
  'update',    // type
  'farmer',    // entityType
  { id, ...updates }  // data
);

// Get pending count
const pendingCount = await offlineSyncService.getTotalPendingCount();

// Manual sync
const result = await offlineSyncService.syncAll();
```

### 3. **Network Status Banner** (`NetworkStatusBanner.js`)

Global UI component that shows connection status.

#### Features:
- **Persistent banner** when offline (amber background)
- **Auto-hides** 2 seconds after coming back online
- **Smooth animations** (slide in/out)
- **Visual indicators**: Icons and status text
- **Cache info** button (optional)

#### Display States:
- 🔴 **Offline**: "Offline Mode - You can continue working..."
- 🟢 **Online**: "Back Online - Connection restored. Syncing data..."

## Integration Points

### 1. Farmer Store (`farmerStore.js`)

```javascript
// Updated fetchFarmers with offline support
fetchFarmers: async (forceRefresh = false) => {
  const farmers = await offlineCacheService.fetchWithCache(
    '@cache_farmers',
    async () => {
      const response = await farmerService.getFarmers(1, 1000);
      return response.farmers || [];
    },
    24 * 60 * 60 * 1000,
    forceRefresh
  );
  
  const isOnline = await offlineCacheService.checkOnline();
  set({ farmers, loading: false, isOffline: !isOnline });
  
  return farmers;
}
```

### 2. Farm Service (`farmService.js`)

```javascript
// Updated getFarmsByFarmer with offline support
async getFarmsByFarmer(farmerId, forceRefresh = false) {
  const farms = await offlineCacheService.fetchWithCache(
    `@cache_farms_${farmerId}`,
    async () => {
      // Fetch from API
      const response = await fetch(...);
      const farmsData = response.farms || [];
      
      // Cache explicitly
      await offlineCacheService.cacheFarmsByFarmer(farmerId, farmsData);
      
      return farmsData;
    },
    24 * 60 * 60 * 1000,
    forceRefresh
  );
  
  return farms;
}
```

### 3. Add Farm Screen (`AddFarmScreen.js`)

Already integrated with offline farm creation:
- Detects network status
- Saves to offline queue if offline
- Shows sync status badge
- Displays network indicator

## Data Flow

### Online Mode:
```
User Action → API Call → Response → Update Cache → Update UI
                ↓
            (Background refresh keeps cache fresh)
```

### Offline Mode:
```
User Action → Check Cache → Return Cached Data → Update UI
                ↓
            (Queue operations for later sync)
```

### Sync Flow:
```
Network Restored → Auto-detect → Sync Offline Queue → Update Cache → Notify User
```

## Cache Strategy

### 1. **Cache-First with Background Refresh**
- Return cached data immediately if available
- Refresh from API in background
- Update cache silently
- Best for: Frequently accessed, slowly changing data

### 2. **Network-First with Cache Fallback**
- Try API first
- Fall back to cache on error
- Best for: Critical data that must be fresh

### 3. **Cache Expiry**
- Farmers: 24 hours
- Farms: 24 hours
- Clusters: 7 days (rarely changes)
- Locations: 7 days (rarely changes)
- User Profile: 1 hour

## Testing Offline Mode

### 1. **Enable Airplane Mode**
```bash
# On device or emulator:
1. Enable Airplane Mode
2. Open CCSA app
3. Navigate to Farmers List
4. See cached farmers
5. Add a new farm (saved offline)
6. Check sync badge shows pending count
```

### 2. **Test Sync**
```bash
1. While offline, add 2-3 farms
2. Disable Airplane Mode
3. App auto-detects network
4. Banner shows "Back Online"
5. Farms sync automatically
6. Sync badge updates to 0
```

### 3. **Test Cache Expiry**
```bash
1. Load farmers (cached for 24h)
2. Wait or manually clear cache
3. Pull to refresh
4. New data fetched and cached
```

### 4. **Developer Tools**
```javascript
// In any component:
import { offlineCacheService } from '../services/offlineCacheService';

// Get cache stats
const stats = await offlineCacheService.getCacheStats();
console.log('Cache Stats:', stats);

// Clear all caches
await offlineCacheService.clearAllCaches();

// Force refresh (bypass cache)
await fetchFarmers(true); // forceRefresh = true
```

## Error Handling

### Network Errors:
- Automatically fall back to cached data
- Show user-friendly error messages
- Retry logic for sync failures

### Cache Errors:
- Gracefully handle missing cache
- Log errors for debugging
- Continue with empty data rather than crashing

### Sync Errors:
- Mark operations as 'failed'
- Increment retry count
- Store error message
- Allow manual retry

## Performance Considerations

### Cache Size:
- Each cached item includes timestamp and metadata
- Farmers list (1000 items): ~500KB
- Farms per farmer: ~10-50KB per farmer
- Total typical cache: 1-5MB

### Memory Usage:
- AsyncStorage is persistent (survives app restart)
- Data loaded on-demand (not all in memory)
- Background refresh doesn't block UI

### Battery Impact:
- Network monitoring uses minimal battery
- Sync only when network restored
- No constant polling

## Future Enhancements

### Planned Features:
1. **Conflict Resolution**: Handle data conflicts when syncing
2. **Selective Sync**: Let users choose what to sync
3. **Batch Operations**: Sync multiple items at once
4. **Compression**: Reduce cache size with compression
5. **Encryption**: Encrypt sensitive cached data
6. **Offline Analytics**: Track offline usage patterns

### API Enhancements:
1. **Delta Sync**: Only sync changed data
2. **Timestamp-based Updates**: Use `If-Modified-Since`
3. **Batch Endpoints**: Upload multiple items in one request

## Troubleshooting

### Cache Not Working:
```javascript
// Check cache stats
const stats = await offlineCacheService.getCacheStats();
console.log(stats);

// Clear and reload
await offlineCacheService.clearAllCaches();
await fetchFarmers(true);
```

### Sync Not Triggering:
```javascript
// Check network status
const isOnline = await offlineCacheService.checkOnline();
console.log('Online:', isOnline);

// Check pending items
const pending = await offlineSyncService.getTotalPendingCount();
console.log('Pending:', pending);

// Manual sync
const result = await offlineSyncService.syncAll();
console.log('Sync result:', result);
```

### Banner Not Showing:
- Ensure `NetworkStatusBanner` is imported in `App.js`
- Check component is rendered after `NavigationContainer`
- Verify z-index styling

## API Reference

### offlineCacheService

| Method | Parameters | Description |
|--------|-----------|-------------|
| `initialize()` | - | Setup network monitoring |
| `checkOnline()` | - | Check current network status |
| `onNetworkChange(callback)` | `callback: (isOnline) => void` | Subscribe to network changes |
| `fetchWithCache(key, fetchFn, expiry, force)` | Cache key, fetch function, expiry ms, force refresh | Main caching method |
| `setCache(key, data, expiry)` | Cache key, data, expiry ms | Manually set cache |
| `getCache(key, expiry)` | Cache key, expiry ms | Manually get cache |
| `clearCache(key)` | Cache key | Clear specific cache |
| `clearAllCaches()` | - | Clear all caches |
| `getCacheStats()` | - | Get cache statistics |

### offlineSyncService

| Method | Parameters | Description |
|--------|-----------|-------------|
| `saveFarmOffline(farmerId, data, farmer)` | Farmer ID, farm data, farmer object | Queue farm for offline |
| `saveOfflineOperation(type, entity, data)` | Operation type, entity type, data | Queue generic operation |
| `getOfflineFarms()` | - | Get all offline farms |
| `getOfflineOperations()` | - | Get all offline operations |
| `getPendingCount()` | - | Get pending farms count |
| `getTotalPendingCount()` | - | Get total pending items |
| `syncAllFarms()` | - | Sync all pending farms |
| `syncAll()` | - | Sync all pending items |
| `setupNetworkListener(onSync)` | Callback | Auto-sync on network |

## Security Considerations

### Data Privacy:
- All cached data stored locally on device
- AsyncStorage not encrypted by default
- Consider encrypting sensitive data (NIN, BVN)

### Authentication:
- Auth tokens not cached (fetched fresh)
- User must be authenticated to access cached data
- Cache cleared on logout (implement if needed)

### Network Security:
- All API calls use HTTPS
- Auth tokens in headers only
- No sensitive data in URLs

## Conclusion

The offline mode implementation provides a **robust, user-friendly experience** for field agents working in areas with poor connectivity. The architecture is **scalable and maintainable**, with clear separation of concerns between caching, syncing, and UI layers.

### Key Benefits:
✅ **Improved UX**: No loading spinners for cached data  
✅ **Increased Productivity**: Work continues offline  
✅ **Data Integrity**: Automatic sync with retry logic  
✅ **Battery Efficient**: Smart network monitoring  
✅ **Scalable**: Easy to add more cached entities  

### Migration Path:
1. ✅ Farmers list (DONE)
2. ✅ Farms by farmer (DONE)
3. 🔄 Clusters (Easy - add to cache service)
4. 🔄 Locations (Easy - add to cache service)
5. 🔄 User profile (Easy - add to cache service)
6. 🔄 Analytics data (Medium - aggregate offline data)

---

**Note**: This implementation follows React Native and AsyncStorage best practices. For production, consider adding comprehensive error tracking (Sentry) and analytics to monitor offline usage patterns.
