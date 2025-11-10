# Quick Start: Adding Offline Support to New Features

## For Developers: How to Make Your Feature Work Offline

### 1. **Service Layer (API Calls)**

#### Before (Online Only):
```javascript
// myService.js
export const myService = {
  async getData() {
    const response = await fetch(`${API_BASE_URL}/api/data`);
    return response.json();
  }
};
```

#### After (Offline Support):
```javascript
// myService.js
import { offlineCacheService } from './offlineCacheService';

export const myService = {
  async getData(forceRefresh = false) {
    return await offlineCacheService.fetchWithCache(
      '@cache_my_data',           // Unique cache key
      async () => {                // Fetch function (runs on cache miss)
        const response = await fetch(`${API_BASE_URL}/api/data`);
        return response.json();
      },
      24 * 60 * 60 * 1000,         // Cache expiry (24 hours)
      forceRefresh                 // Force refresh flag
    );
  }
};
```

### 2. **Store Layer (Zustand/State Management)**

#### Before:
```javascript
export const useMyStore = create((set) => ({
  data: [],
  loading: false,
  
  fetchData: async () => {
    set({ loading: true });
    const data = await myService.getData();
    set({ data, loading: false });
  }
}));
```

#### After:
```javascript
import { offlineCacheService } from '../services/offlineCacheService';

export const useMyStore = create((set) => ({
  data: [],
  loading: false,
  isOffline: false,
  
  fetchData: async (forceRefresh = false) => {
    try {
      set({ loading: true });
      const data = await myService.getData(forceRefresh);
      const isOnline = await offlineCacheService.checkOnline();
      
      set({ 
        data, 
        loading: false, 
        isOffline: !isOnline 
      });
    } catch (error) {
      // Try cache on error
      const cached = await offlineCacheService.getCache('@cache_my_data');
      if (cached) {
        set({ 
          data: cached, 
          loading: false, 
          isOffline: true 
        });
      } else {
        throw error;
      }
    }
  }
}));
```

### 3. **Component Layer (React Native)**

#### Add Network Status:
```javascript
import { offlineCacheService } from '../services/offlineCacheService';

export default function MyScreen() {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = offlineCacheService.onNetworkChange((online) => {
      setIsOffline(!online);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <View>
      {isOffline && (
        <Text style={styles.offlineIndicator}>
          📴 Offline Mode
        </Text>
      )}
      {/* Rest of your component */}
    </View>
  );
}
```

### 4. **Saving Data Offline**

#### For creating new items:
```javascript
import { offlineSyncService } from '../services/offlineSyncService';

async function createItem(itemData) {
  const isOnline = await offlineCacheService.checkOnline();
  
  if (!isOnline) {
    // Save to offline queue
    await offlineSyncService.saveOfflineOperation(
      'create',      // operation type
      'item',        // entity type
      itemData       // data to sync later
    );
    
    Alert.alert('Saved Offline', 'Will sync when online');
    return { success: true, offline: true };
  }
  
  // Online: call API directly
  return await myService.createItem(itemData);
}
```

## Cache Key Naming Convention

```javascript
// List data
'@cache_farmers'
'@cache_farms'
'@cache_items'

// Single item
'@cache_farmer_<id>'
'@cache_farm_<id>'

// Related data
'@cache_farms_by_farmer_<farmerId>'
'@cache_items_by_user_<userId>'

// Dropdown data
'@cache_clusters_dropdown'
'@cache_categories_dropdown'
```

## Cache Expiry Guidelines

```javascript
// Frequently changing data (1 hour)
1 * 60 * 60 * 1000

// Daily updates (24 hours)
24 * 60 * 60 * 1000

// Rarely changing (7 days)
7 * 24 * 60 * 60 * 1000

// Static data (30 days)
30 * 24 * 60 * 60 * 1000

// No expiry (until manually cleared)
null
```

## Common Patterns

### Pattern 1: List with Details
```javascript
// List screen
const farmers = await offlineCacheService.fetchWithCache(
  '@cache_farmers',
  () => farmerService.getFarmers(),
  24 * 60 * 60 * 1000
);

// Detail screen
const farmer = await offlineCacheService.fetchWithCache(
  `@cache_farmer_${farmerId}`,
  () => farmerService.getFarmerById(farmerId),
  1 * 60 * 60 * 1000  // Shorter expiry for details
);
```

### Pattern 2: Dropdown Data
```javascript
const clusters = await offlineCacheService.fetchWithCache(
  '@cache_clusters_dropdown',
  () => clusterService.getClustersForDropdown(),
  7 * 24 * 60 * 60 * 1000  // Long expiry
);
```

### Pattern 3: User-Specific Data
```javascript
const userFarms = await offlineCacheService.fetchWithCache(
  `@cache_farms_by_user_${userId}`,
  () => farmService.getUserFarms(userId),
  24 * 60 * 60 * 1000
);
```

### Pattern 4: Force Refresh (Pull to Refresh)
```javascript
const onRefresh = async () => {
  setRefreshing(true);
  await fetchData(true);  // forceRefresh = true
  setRefreshing(false);
};
```

## Checklist for New Feature

- [ ] Add `offlineCacheService` import to service
- [ ] Wrap API calls in `fetchWithCache()`
- [ ] Add force refresh parameter
- [ ] Update store with `isOffline` state
- [ ] Add fallback to cache on errors
- [ ] Add network status indicator in UI
- [ ] Test in airplane mode
- [ ] Test cache expiry
- [ ] Test force refresh
- [ ] Document cache keys used
- [ ] Add to offline mode docs

## Testing Your Offline Feature

### 1. Test Offline Read:
```bash
1. Load data while online
2. Enable airplane mode
3. Close and reopen app
4. Navigate to your screen
5. Verify data loads from cache
```

### 2. Test Cache Expiry:
```javascript
// Temporarily set short expiry for testing
const data = await offlineCacheService.fetchWithCache(
  '@cache_test',
  fetchFunction,
  5000  // 5 seconds for testing
);

// Wait 6 seconds
await new Promise(resolve => setTimeout(resolve, 6000));

// Fetch again - should call API
```

### 3. Test Force Refresh:
```bash
1. Load data (cache created)
2. Change data on server
3. Pull to refresh
4. Verify new data appears
5. Check cache updated
```

### 4. Test Error Fallback:
```bash
1. Load data while online
2. Disable airplane mode
3. Stop API server
4. Try to fetch data
5. Verify falls back to cache
```

## Common Mistakes to Avoid

❌ **Don't**: Cache authentication tokens
```javascript
// WRONG
await offlineCacheService.setCache('@cache_token', token);
```

✅ **Do**: Fetch tokens fresh each time
```javascript
const token = await auth.currentUser.getIdToken();
```

---

❌ **Don't**: Use same cache key for different data
```javascript
// WRONG
await offlineCacheService.setCache('@cache_data', farmers);
await offlineCacheService.setCache('@cache_data', farms); // Overwrites!
```

✅ **Do**: Use unique, descriptive keys
```javascript
await offlineCacheService.setCache('@cache_farmers', farmers);
await offlineCacheService.setCache('@cache_farms', farms);
```

---

❌ **Don't**: Forget to handle cache errors
```javascript
// WRONG
const data = await offlineCacheService.getCache('@cache_data');
data.map(...); // Crash if data is null!
```

✅ **Do**: Check for null/undefined
```javascript
const data = await offlineCacheService.getCache('@cache_data');
if (data && Array.isArray(data)) {
  data.map(...);
}
```

---

❌ **Don't**: Cache huge files (images, videos)
```javascript
// WRONG - Will fill device storage
await offlineCacheService.setCache('@cache_image', hugeBase64Image);
```

✅ **Do**: Cache metadata, download files separately
```javascript
await offlineCacheService.setCache('@cache_image_url', imageUrl);
```

## Need Help?

1. Check `COMPLETE_OFFLINE_MODE.md` for architecture details
2. Check `OFFLINE_MODE_SUMMARY.md` for implementation status
3. Look at existing implementations:
   - `farmerStore.js` - Store integration
   - `farmService.js` - Service integration
   - `clusterService.js` - Dropdown data caching
4. Run debug commands:
   ```javascript
   const stats = await offlineCacheService.getCacheStats();
   console.log('Cache Stats:', stats);
   ```

## Quick Reference

```javascript
// Import
import { offlineCacheService } from '../services/offlineCacheService';

// Check online
const isOnline = await offlineCacheService.checkOnline();

// Listen to network
const unsubscribe = offlineCacheService.onNetworkChange(callback);

// Fetch with cache
const data = await offlineCacheService.fetchWithCache(key, fetchFn, expiry);

// Manual cache operations
await offlineCacheService.setCache(key, data, expiry);
const data = await offlineCacheService.getCache(key, expiry);
await offlineCacheService.clearCache(key);

// Cache stats
const stats = await offlineCacheService.getCacheStats();
```

---

**Remember**: Offline support is about graceful degradation. The app should work as well as possible without network, but be clear when network is absolutely required.
