import { create } from 'zustand';
import { farmerService } from '../services/farmerService';
import { auth } from '../services/firebase';
import { offlineCacheService } from '../services/offlineCacheService';

export const useFarmerStore = create((set, get) => ({
  farmers: [],
  loading: false,
  error: null,
  isOffline: false,
  totalCount: 0, // Add total count for agent's farmers
  pagination: {
    page: 1,
    limit: 50, // Load 50 at a time for better performance
    total: 0,
    hasMore: false,
    loadedAll: false,
  },
  filters: {
    search: '',
    state: '',
    cluster: '',
    status: '',
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters }),
  
  resetPagination: () => set({ 
    pagination: { page: 1, limit: 50, total: 0, hasMore: false, loadedAll: false },
    farmers: []
  }),

  addFarmer: async (farmerData) => {
    try {
      set({ loading: true, error: null });
      const newFarmer = await farmerService.createFarmer(farmerData);
      set((state) => ({
        farmers: [newFarmer, ...state.farmers], // Add to beginning
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
        loading: false,
      }));
      
      // Update cache
      const currentFarmers = get().farmers;
      await offlineCacheService.cacheFarmers(currentFarmers);
      
      return newFarmer;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Load ALL farmers for mobile agents (no pagination)
  loadAllFarmers: async () => {
    try {
      set({ loading: true, error: null });
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Request all farmers with loadAll flag
      const response = await farmerService.getFarmers(1, 10000, '', '', '', '', true);
      
      const farmers = response.farmers || [];
      const totalCount = response.pagination?.total || farmers.length;
      
      set({ 
        farmers,
        totalCount,
        loading: false,
        pagination: {
          page: 1,
          limit: totalCount,
          total: totalCount,
          hasMore: false,
          loadedAll: true,
        }
      });
      
      // Cache all farmers
      await offlineCacheService.cacheFarmers(farmers);
      
      console.log(`✅ Loaded all ${farmers.length} farmers`);
      return farmers;
    } catch (error) {
      console.error('Error loading all farmers:', error);
      
      // Try to get cached data
      const cachedFarmers = await offlineCacheService.getCachedFarmers();
      if (cachedFarmers) {
        console.log('✅ Using cached farmers after error');
        set({ 
          farmers: cachedFarmers,
          totalCount: cachedFarmers.length,
          loading: false, 
          isOffline: true,
          error: 'Using offline data',
          pagination: {
            page: 1,
            limit: cachedFarmers.length,
            total: cachedFarmers.length,
            hasMore: false,
            loadedAll: true,
          }
        });
        return cachedFarmers;
      }
      
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Legacy method - now calls paginated fetchFarmers
  getFarmers: async () => {
    return get().fetchFarmers(true);
  },

  // Optimized fetchFarmers with pagination (replaces loadAll default)
  fetchFarmers: async (resetPagination = false) => {
    try {
      set({ loading: true, error: null });
      
      // Check authentication first
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const { pagination, filters } = get();
      const currentPage = resetPagination ? 1 : pagination.page;
      
      console.log(`📄 Fetching farmers - Page ${currentPage}, Limit ${pagination.limit}`);
      
      const response = await farmerService.getFarmers(
        currentPage,
        pagination.limit,
        filters.search,
        filters.state,
        filters.cluster,
        filters.status,
        false // Use pagination
      );
      
      const newFarmers = response.farmers || [];
      const paginationData = response.pagination || {};
      const totalCount = paginationData.total || newFarmers.length;
      
      console.log(`✅ Loaded ${newFarmers.length} farmers, Total: ${totalCount}`);
      
      // If resetting, replace all farmers. Otherwise, keep existing ones
      const farmers = resetPagination ? newFarmers : get().farmers;
      
      set({ 
        farmers,
        totalCount,
        loading: false,
        pagination: {
          page: currentPage,
          limit: pagination.limit,
          total: totalCount,
          hasMore: newFarmers.length >= pagination.limit && farmers.length < totalCount,
          loadedAll: farmers.length >= totalCount,
        }
      });
      
      // Cache farmers for offline use
      await offlineCacheService.cacheFarmers(farmers);
      
      return farmers;
    } catch (error) {
      console.error('Error fetching farmers:', error);
      
      // Try to get cached data
      const cachedFarmers = await offlineCacheService.getCachedFarmers();
      if (cachedFarmers) {
        console.log('✅ Using cached farmers after error');
        set({ 
          farmers: cachedFarmers,
          totalCount: cachedFarmers.length,
          loading: false, 
          isOffline: true,
          error: 'Using offline data',
          pagination: {
            page: 1,
            limit: cachedFarmers.length,
            total: cachedFarmers.length,
            hasMore: false,
            loadedAll: true,
          }
        });
        return cachedFarmers;
      }
      
      set({ 
        farmers: [],
        totalCount: 0,
        loading: false, 
        isOffline: true,
        error: error.message 
      });
      throw error;
    }
  },

  // Load more farmers (infinite scroll)
  loadMoreFarmers: async () => {
    const { pagination, loading } = get();
    
    if (loading || !pagination.hasMore) {
      return;
    }
    
    try {
      set({ loading: true });
      
      const nextPage = pagination.page + 1;
      console.log(`📄 Loading more farmers - Page ${nextPage}`);
      
      const response = await farmerService.getFarmers(
        nextPage,
        pagination.limit,
        '',
        '',
        '',
        '',
        false
      );
      
      const newFarmers = response.farmers || [];
      const currentFarmers = get().farmers;
      const allFarmers = [...currentFarmers, ...newFarmers];
      
      console.log(`✅ Loaded ${newFarmers.length} more farmers, Total loaded: ${allFarmers.length}`);
      
      set({ 
        farmers: allFarmers,
        loading: false,
        pagination: {
          ...pagination,
          page: nextPage,
          hasMore: newFarmers.length >= pagination.limit && allFarmers.length < pagination.total,
          loadedAll: allFarmers.length >= pagination.total,
        }
      });
      
      // Update cache
      await offlineCacheService.cacheFarmers(allFarmers);
      
      return allFarmers;
    } catch (error) {
      console.error('Error loading more farmers:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  searchFarmers: async (query) => {
    try {
      const { farmers } = get();
      
      // If we have all farmers loaded, search locally for instant results
      if (get().pagination.loadedAll && farmers.length > 0) {
        const searchLower = query.toLowerCase().trim();
        
        if (!searchLower) {
          return farmers; // Return all if no search query
        }
        
        const filtered = farmers.filter(farmer => {
          const fullName = `${farmer.firstName} ${farmer.middleName || ''} ${farmer.lastName}`.toLowerCase();
          const phone = (farmer.phone || '').toLowerCase();
          const nin = (farmer.nin || '').toLowerCase();
          const email = (farmer.email || '').toLowerCase();
          
          return fullName.includes(searchLower) ||
                 phone.includes(searchLower) ||
                 nin.includes(searchLower) ||
                 email.includes(searchLower);
        });
        
        console.log(`🔍 Local search: ${filtered.length} results for "${query}"`);
        return filtered;
      }
      
      // Otherwise fetch from API
      set({ loading: true, error: null });
      const response = await farmerService.searchFarmers(query);
      const results = response.farmers || response || [];
      set({ loading: false });
      return results;
    } catch (error) {
      set({ loading: false, error: error.message });
      return [];
    }
  },

  // Filter farmers locally (instant)
  filterFarmers: (filters) => {
    const { farmers } = get();
    
    let filtered = [...farmers];
    
    if (filters.state) {
      filtered = filtered.filter(f => f.state === filters.state);
    }
    
    if (filters.cluster) {
      filtered = filtered.filter(f => f.clusterId === filters.cluster);
    }
    
    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(farmer => {
        const fullName = `${farmer.firstName} ${farmer.middleName || ''} ${farmer.lastName}`.toLowerCase();
        return fullName.includes(searchLower) ||
               (farmer.phone || '').toLowerCase().includes(searchLower) ||
               (farmer.nin || '').toLowerCase().includes(searchLower);
      });
    }
    
    return filtered;
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
