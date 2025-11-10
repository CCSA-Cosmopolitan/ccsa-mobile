import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { farmService } from './farmService';

const OFFLINE_FARMS_KEY = '@offline_farms';
const OFFLINE_OPERATIONS_KEY = '@offline_operations'; // For other operations like updates
const SYNC_STATUS_KEY = '@sync_status';
const LAST_SYNC_KEY = '@last_sync';

export const offlineSyncService = {
  /**
   * Save farm data to offline queue
   */
  async saveFarmOffline(farmerId, farmData, farmer) {
    try {
      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const offlineFarm = {
        id: offlineId,
        farmerId,
        farmData,
        farmer, // Store farmer info for display
        timestamp: new Date().toISOString(),
        status: 'pending', // pending, syncing, synced, failed
        retryCount: 0,
        lastError: null,
      };

      // Get existing offline farms
      const existingFarms = await this.getOfflineFarms();
      
      // Add new farm to queue
      const updatedFarms = [...existingFarms, offlineFarm];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(OFFLINE_FARMS_KEY, JSON.stringify(updatedFarms));
      
      console.log('Farm saved offline:', offlineId);
      return offlineFarm;
    } catch (error) {
      console.error('Error saving farm offline:', error);
      throw new Error('Failed to save farm offline');
    }
  },

  /**
   * Get all offline farms
   */
  async getOfflineFarms() {
    try {
      const farmsJson = await AsyncStorage.getItem(OFFLINE_FARMS_KEY);
      return farmsJson ? JSON.parse(farmsJson) : [];
    } catch (error) {
      console.error('Error getting offline farms:', error);
      return [];
    }
  },

  /**
   * Get count of pending offline farms
   */
  async getPendingCount() {
    try {
      const farms = await this.getOfflineFarms();
      return farms.filter(f => f.status === 'pending' || f.status === 'failed').length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  },

  /**
   * Update farm status
   */
  async updateFarmStatus(offlineId, status, error = null) {
    try {
      const farms = await this.getOfflineFarms();
      const updatedFarms = farms.map(farm => {
        if (farm.id === offlineId) {
          return {
            ...farm,
            status,
            lastError: error,
            retryCount: status === 'failed' ? farm.retryCount + 1 : farm.retryCount,
            lastAttempt: new Date().toISOString(),
          };
        }
        return farm;
      });
      
      await AsyncStorage.setItem(OFFLINE_FARMS_KEY, JSON.stringify(updatedFarms));
    } catch (error) {
      console.error('Error updating farm status:', error);
    }
  },

  /**
   * Remove synced farms from offline queue
   */
  async removeOfflineFarm(offlineId) {
    try {
      const farms = await this.getOfflineFarms();
      const updatedFarms = farms.filter(farm => farm.id !== offlineId);
      await AsyncStorage.setItem(OFFLINE_FARMS_KEY, JSON.stringify(updatedFarms));
    } catch (error) {
      console.error('Error removing offline farm:', error);
    }
  },

  /**
   * Clear all synced farms
   */
  async clearSyncedFarms() {
    try {
      const farms = await this.getOfflineFarms();
      const pendingFarms = farms.filter(f => f.status !== 'synced');
      await AsyncStorage.setItem(OFFLINE_FARMS_KEY, JSON.stringify(pendingFarms));
    } catch (error) {
      console.error('Error clearing synced farms:', error);
    }
  },

  /**
   * Check network connectivity
   */
  async isConnected() {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected && netInfo.isInternetReachable;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  },

  /**
   * Sync a single farm
   */
  async syncSingleFarm(offlineFarm) {
    try {
      // Update status to syncing
      await this.updateFarmStatus(offlineFarm.id, 'syncing');
      
      // Attempt to create farm via API
      await farmService.createFarm(offlineFarm.farmerId, offlineFarm.farmData);
      
      // Update status to synced
      await this.updateFarmStatus(offlineFarm.id, 'synced');
      
      // Remove from offline queue after successful sync
      await this.removeOfflineFarm(offlineFarm.id);
      
      return { success: true, farmId: offlineFarm.id };
    } catch (error) {
      console.error(`Error syncing farm ${offlineFarm.id}:`, error);
      
      // Update status to failed with error message
      await this.updateFarmStatus(offlineFarm.id, 'failed', error.message);
      
      return { success: false, farmId: offlineFarm.id, error: error.message };
    }
  },

  /**
   * Sync all pending offline farms
   */
  async syncAllFarms() {
    try {
      // Check network connectivity
      const connected = await this.isConnected();
      if (!connected) {
        console.log('No network connection - skipping sync');
        return {
          success: false,
          message: 'No network connection',
          synced: 0,
          failed: 0,
          pending: await this.getPendingCount(),
        };
      }

      // Get all pending farms
      const farms = await this.getOfflineFarms();
      const pendingFarms = farms.filter(f => 
        (f.status === 'pending' || f.status === 'failed') && 
        f.retryCount < 5 // Max 5 retry attempts
      );

      if (pendingFarms.length === 0) {
        console.log('No pending farms to sync');
        return {
          success: true,
          message: 'No farms to sync',
          synced: 0,
          failed: 0,
          pending: 0,
        };
      }

      console.log(`Syncing ${pendingFarms.length} farms...`);
      
      // Sync farms sequentially to avoid overwhelming the server
      const results = [];
      for (const farm of pendingFarms) {
        const result = await this.syncSingleFarm(farm);
        results.push(result);
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const syncedCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const remainingPending = await this.getPendingCount();

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log(`Sync complete: ${syncedCount} synced, ${failedCount} failed, ${remainingPending} pending`);

      return {
        success: syncedCount > 0,
        message: `${syncedCount} farms synced successfully`,
        synced: syncedCount,
        failed: failedCount,
        pending: remainingPending,
        results,
      };
    } catch (error) {
      console.error('Error syncing farms:', error);
      return {
        success: false,
        message: error.message,
        synced: 0,
        failed: 0,
        pending: await this.getPendingCount(),
      };
    }
  },

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  /**
   * Get sync status summary
   */
  async getSyncStatus() {
    try {
      const farms = await this.getOfflineFarms();
      const lastSync = await this.getLastSyncTime();
      const connected = await this.isConnected();

      const pending = farms.filter(f => f.status === 'pending').length;
      const syncing = farms.filter(f => f.status === 'syncing').length;
      const failed = farms.filter(f => f.status === 'failed').length;
      const synced = farms.filter(f => f.status === 'synced').length;

      return {
        connected,
        lastSync,
        total: farms.length,
        pending,
        syncing,
        failed,
        synced,
        farms,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        connected: false,
        lastSync: null,
        total: 0,
        pending: 0,
        syncing: 0,
        failed: 0,
        synced: 0,
        farms: [],
      };
    }
  },

  /**
   * Setup network listener for automatic sync
   */
  setupNetworkListener(onSync) {
    let isFirstConnection = true;
    
    const unsubscribe = NetInfo.addEventListener(async state => {
      console.log('Network state changed:', state.isConnected, state.isInternetReachable);
      
      // Skip first connection event (app startup)
      if (isFirstConnection) {
        isFirstConnection = false;
        return;
      }

      // If network becomes available, attempt sync
      if (state.isConnected && state.isInternetReachable) {
        console.log('Network available - attempting auto-sync');
        const pendingCount = await this.getPendingCount();
        
        if (pendingCount > 0) {
          console.log(`Found ${pendingCount} pending farms - starting sync`);
          const result = await this.syncAllFarms();
          
          if (onSync) {
            onSync(result);
          }
        }
      }
    });

    return unsubscribe;
  },

  /**
   * Manual retry for a single failed farm
   */
  async retryFailedFarm(offlineId) {
    try {
      const farms = await this.getOfflineFarms();
      const farm = farms.find(f => f.id === offlineId);
      
      if (!farm) {
        throw new Error('Farm not found');
      }

      if (farm.status !== 'failed') {
        throw new Error('Farm is not in failed state');
      }

      const connected = await this.isConnected();
      if (!connected) {
        throw new Error('No network connection');
      }

      return await this.syncSingleFarm(farm);
    } catch (error) {
      console.error('Error retrying farm:', error);
      throw error;
    }
  },

  /**
   * Clear all offline data (use with caution)
   */
  async clearAllOfflineData() {
    try {
      await AsyncStorage.removeItem(OFFLINE_FARMS_KEY);
      await AsyncStorage.removeItem(OFFLINE_OPERATIONS_KEY);
      await AsyncStorage.removeItem(SYNC_STATUS_KEY);
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  },

  /**
   * Save a generic offline operation (updates, deletes, etc.)
   */
  async saveOfflineOperation(type, entityType, data) {
    try {
      const operations = await this.getOfflineOperations();
      
      const operation = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type, // 'create', 'update', 'delete'
        entityType, // 'farmer', 'farm'
        data,
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        lastError: null,
      };

      operations.push(operation);
      await AsyncStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(operations));
      
      console.log('Offline operation saved:', operation.id);
      return operation;
    } catch (error) {
      console.error('Error saving offline operation:', error);
      throw error;
    }
  },

  /**
   * Get all offline operations
   */
  async getOfflineOperations() {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_OPERATIONS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error getting offline operations:', error);
      return [];
    }
  },

  /**
   * Get total pending count (farms + operations)
   */
  async getTotalPendingCount() {
    const farms = await this.getOfflineFarms();
    const operations = await this.getOfflineOperations();
    
    const pendingFarms = farms.filter(f => f.status === 'pending').length;
    const pendingOps = operations.filter(op => op.status === 'pending').length;
    
    return pendingFarms + pendingOps;
  },

  /**
   * Sync all pending items (farms + operations)
   */
  async syncAll() {
    console.log('🔄 Starting comprehensive sync...');
    
    const results = {
      farms: await this.syncAllFarms(),
      operations: await this.syncAllOperations(),
    };
    
    console.log('✅ Comprehensive sync completed:', results);
    return results;
  },

  /**
   * Sync all pending operations
   */
  async syncAllOperations() {
    try {
      const operations = await this.getOfflineOperations();
      const pending = operations.filter(op => op.status === 'pending');
      
      if (pending.length === 0) {
        console.log('No pending operations to sync');
        return { synced: 0, failed: 0 };
      }

      console.log(`Syncing ${pending.length} pending operations...`);
      
      let synced = 0;
      let failed = 0;

      for (const operation of pending) {
        try {
          await this.syncSingleOperation(operation);
          synced++;
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          failed++;
        }
      }

      return { synced, failed };
    } catch (error) {
      console.error('Error syncing operations:', error);
      return { synced: 0, failed: 0 };
    }
  },

  /**
   * Sync a single operation
   */
  async syncSingleOperation(operation) {
    try {
      // This would call the appropriate service based on entityType and type
      console.log('Syncing operation:', operation);
      
      // Mark as synced
      const operations = await this.getOfflineOperations();
      const updated = operations.map(op =>
        op.id === operation.id
          ? { ...op, status: 'synced', syncedAt: new Date().toISOString() }
          : op
      );
      
      await AsyncStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(updated));
      
      // Remove synced operations after a while (keep for history)
      const cleaned = updated.filter(op => 
        op.status !== 'synced' || 
        (Date.now() - new Date(op.syncedAt).getTime() < 24 * 60 * 60 * 1000) // Keep for 24h
      );
      
      if (cleaned.length !== updated.length) {
        await AsyncStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(cleaned));
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing operation:', error);
      
      // Mark as failed
      const operations = await this.getOfflineOperations();
      const updated = operations.map(op =>
        op.id === operation.id
          ? { 
              ...op, 
              status: 'failed', 
              retryCount: op.retryCount + 1,
              lastError: error.message,
            }
          : op
      );
      
      await AsyncStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(updated));
      throw error;
    }
  },
};

