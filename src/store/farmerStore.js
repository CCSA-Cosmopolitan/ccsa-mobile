import { create } from 'zustand';
import { farmerService } from '../services/farmerService';
import { auth } from '../services/firebase';
import { offlineCacheService } from '../services/offlineCacheService';

export const useFarmerStore = create((set, get) => ({
  farmers: [],
  loading: false,
  error: null,
  isOffline: false,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addFarmer: async (farmerData) => {
    try {
      set({ loading: true, error: null });
      const newFarmer = await farmerService.createFarmer(farmerData);
      set((state) => ({
        farmers: [...state.farmers, newFarmer],
        loading: false,
      }));
      return newFarmer; // Return the created farmer
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  getFarmers: async () => {
    try {
      set({ loading: true, error: null });
      // Get a large number of farmers for the list view
      const response = await farmerService.getFarmers(1, 1000);
      // Extract farmers array from the paginated response
      const farmers = response.farmers || [];
      set({ farmers, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  // Add the missing fetchFarmers function that components are trying to use
  fetchFarmers: async (forceRefresh = false) => {
    try {
      set({ loading: true, error: null });
      
      // Check authentication first
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Use cache service for offline-first approach
      const farmers = await offlineCacheService.fetchWithCache(
        '@cache_farmers',
        async () => {
          // This function is called when cache miss or force refresh
          const response = await farmerService.getFarmers(1, 1000);
          
          // Extract farmers array from the paginated response
          let farmersData = [];
          if (response) {
            if (Array.isArray(response)) {
              farmersData = response;
            } else if (response.farmers && Array.isArray(response.farmers)) {
              farmersData = response.farmers;
            } else if (response.data && Array.isArray(response.data)) {
              farmersData = response.data;
            }
          }
          
          return farmersData;
        },
        24 * 60 * 60 * 1000, // 24 hour expiry
        forceRefresh
      );
      
      const isOnline = await offlineCacheService.checkOnline();
      set({ farmers, loading: false, isOffline: !isOnline });
      
      return farmers;
    } catch (error) {
      console.error('Error fetching farmers:', error);
      
      // Try to get cached data even if expired
      const cachedFarmers = await offlineCacheService.getCachedFarmers();
      if (cachedFarmers) {
        console.log('✅ Using cached farmers after error');
        set({ 
          farmers: cachedFarmers,
          loading: false, 
          isOffline: true,
          error: 'Using offline data'
        });
        return cachedFarmers;
      }
      
      set({ 
        farmers: [],
        loading: false, 
        isOffline: true,
        error: error.message 
      });
      throw error;
    }
  },

  searchFarmers: async (query) => {
    try {
      set({ loading: true, error: null });
      const farmers = await farmerService.searchFarmers(query);
      set({ loading: false });
      return farmers;
    } catch (error) {
      set({ loading: false, error: error.message });
      return [];
    }
  },

  getFarmerByNin: async (nin) => {
    try {
      set({ loading: true, error: null });
      const farmer = await farmerService.getFarmerByNin(nin);
      set({ loading: false });
      return farmer;
    } catch (error) {
      set({ loading: false, error: error.message });
      return null;
    }
  },

  updateFarmer: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedFarmer = await farmerService.updateFarmer(id, updates);
      set((state) => ({
        farmers: state.farmers.map((farmer) =>
          farmer.id === id ? updatedFarmer : farmer
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteFarmer: async (id) => {
    try {
      set({ loading: true, error: null });
      await farmerService.deleteFarmer(id);
      set((state) => ({
        farmers: state.farmers.filter((farmer) => farmer.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
}));
