import API_CONFIG from '../config/api';
import { lazyLocationService } from './lazyLocationService';

class APILocationService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.cache = {
      states: null,
      localGovernments: new Map(),
      wards: new Map(),
      pollingUnits: new Map()
    };
    
    console.log('🚀 APILocationService initialized with base URL:', this.baseURL);
    console.log('📦 Using optimized location data as fallback');
  }

  // Get all states from API or optimized data
  async getStates() {
    if (this.cache.states) {
      return this.cache.states;
    }

    try {
      // Try API first
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.STATES}`);
      const result = await response.json();
      
      if (result.success && (result.data || result.states)) {
        const rawStates = result.data || result.states || [];
        this.cache.states = rawStates.map(state => ({
          id: state.id,
          name: this.formatName(state.name),
          value: state.id,
          code: state.code
        }));
        
        console.log('✅ States loaded from API:', this.cache.states.length);
        return this.cache.states;
      } else {
        throw new Error(result.message || 'Failed to fetch states');
      }
    } catch (error) {
      console.error('❌ Error loading states from API:', error);
      // Fallback to optimized local data
      console.log('🔄 Falling back to optimized local data');
      return this.getStatesFromOptimizedData();
    }
  }

  // Get states from optimized local data
  getStatesFromOptimizedData() {
    try {
      const states = lazyLocationService.getStates();
      this.cache.states = states;
      console.log('✅ States loaded from optimized data:', states.length);
      return states;
    } catch (error) {
      console.error('❌ Error loading from optimized data:', error);
      return this.getFallbackStates();
    }
  }

  // Get local governments for a specific state
  async getLocalGovernments(stateId) {
    if (!stateId) return [];
    
    const cacheKey = stateId;
    if (this.cache.localGovernments.has(cacheKey)) {
      return this.cache.localGovernments.get(cacheKey);
    }

    try {
      // Try API first
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.LOCAL_GOVERNMENTS}?stateId=${stateId}`);
      const result = await response.json();
      
      if (result.success) {
        const lgas = result.data.map(lga => ({
          id: lga.id,
          name: this.formatName(lga.name),
          value: lga.id,
          code: lga.code
        }));
        
        this.cache.localGovernments.set(cacheKey, lgas);
        console.log(`✅ LGAs loaded from API for state ${stateId}:`, lgas.length);
        return lgas;
      } else {
        throw new Error(result.message || 'Failed to fetch local governments');
      }
    } catch (error) {
      console.error('❌ Error loading local governments from API:', error);
      // Fallback to optimized local data
      console.log('🔄 Falling back to optimized local data for LGAs');
      return this.getLGAsFromOptimizedData(stateId);
    }
  }

  // Get LGAs from optimized local data
  async getLGAsFromOptimizedData(stateId) {
    try {
      const lgas = await lazyLocationService.getLGAs(stateId);
      this.cache.localGovernments.set(stateId, lgas);
      console.log(`✅ LGAs loaded from optimized data for state ${stateId}:`, lgas.length);
      return lgas;
    } catch (error) {
      console.error('❌ Error loading LGAs from optimized data:', error);
      return [];
    }
  }

  // Get wards for a specific local government
  async getWards(lgaId) {
    if (!lgaId) return [];
    
    const cacheKey = lgaId;
    if (this.cache.wards.has(cacheKey)) {
      return this.cache.wards.get(cacheKey);
    }

    try {
      // Try API first
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.WARDS}?lgaId=${lgaId}`);
      const result = await response.json();
      
      if (result.success) {
        const wards = result.data.map(ward => ({
          id: ward.id,
          name: this.formatName(ward.name),
          value: ward.id,
          code: ward.code
        }));
        
        this.cache.wards.set(cacheKey, wards);
        console.log(`✅ Wards loaded from API for LGA ${lgaId}:`, wards.length);
        return wards;
      } else {
        throw new Error(result.message || 'Failed to fetch wards');
      }
    } catch (error) {
      console.error('❌ Error loading wards from API:', error);
      // Fallback to optimized local data
      console.log('🔄 Falling back to optimized local data for wards');
      return this.getWardsFromOptimizedData(lgaId);
    }
  }

  // Get wards from optimized local data
  async getWardsFromOptimizedData(lgaId) {
    try {
      const wards = await lazyLocationService.getWards(lgaId);
      this.cache.wards.set(lgaId, wards);
      console.log(`✅ Wards loaded from optimized data for LGA ${lgaId}:`, wards.length);
      return wards;
    } catch (error) {
      console.error('❌ Error loading wards from optimized data:', error);
      return [];
    }
  }

  // Get polling units for a specific ward
  async getPollingUnits(wardId) {
    if (!wardId) return [];
    
    const cacheKey = wardId;
    if (this.cache.pollingUnits.has(cacheKey)) {
      return this.cache.pollingUnits.get(cacheKey);
    }

    try {
      // Try API first
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.POLLING_UNITS}?wardId=${wardId}`);
      const result = await response.json();
      
      if (result.success) {
        const pollingUnits = result.data.map(unit => ({
          id: unit.id,
          name: this.formatName(unit.name),
          value: unit.id,
          code: unit.code
        }));
        
        this.cache.pollingUnits.set(cacheKey, pollingUnits);
        console.log(`✅ Polling units loaded from API for ward ${wardId}:`, pollingUnits.length);
        return pollingUnits;
      } else {
        throw new Error(result.message || 'Failed to fetch polling units');
      }
    } catch (error) {
      console.error('❌ Error loading polling units from API:', error);
      // Fallback to optimized local data
      console.log('🔄 Falling back to optimized local data for polling units');
      return this.getPollingUnitsFromOptimizedData(wardId);
    }
  }

  // Get polling units from optimized local data
  getPollingUnitsFromOptimizedData(wardId) {
    try {
      const pollingUnits = optimizedLocationService.getPollingUnits(wardId);
      this.cache.pollingUnits.set(wardId, pollingUnits);
      console.log(`✅ Polling units loaded from optimized data for ward ${wardId}:`, pollingUnits.length);
      return pollingUnits;
    } catch (error) {
      console.error('❌ Error loading polling units from optimized data:', error);
      return [];
    }
  }

  // Fallback states data (minimal local data)
  getFallbackStates() {
    return [
      { id: 'abia', name: 'Abia', value: 'abia' },
      { id: 'adamawa', name: 'Adamawa', value: 'adamawa' },
      { id: 'akwa-ibom', name: 'Akwa Ibom', value: 'akwa-ibom' },
      { id: 'anambra', name: 'Anambra', value: 'anambra' },
      { id: 'bauchi', name: 'Bauchi', value: 'bauchi' },
      { id: 'bayelsa', name: 'Bayelsa', value: 'bayelsa' },
      { id: 'benue', name: 'Benue', value: 'benue' },
      { id: 'borno', name: 'Borno', value: 'borno' },
      { id: 'cross-river', name: 'Cross River', value: 'cross-river' },
      { id: 'delta', name: 'Delta', value: 'delta' },
      { id: 'ebonyi', name: 'Ebonyi', value: 'ebonyi' },
      { id: 'edo', name: 'Edo', value: 'edo' },
      { id: 'ekiti', name: 'Ekiti', value: 'ekiti' },
      { id: 'enugu', name: 'Enugu', value: 'enugu' },
      { id: 'fct', name: 'FCT - Abuja', value: 'fct' },
      { id: 'gombe', name: 'Gombe', value: 'gombe' },
      { id: 'imo', name: 'Imo', value: 'imo' },
      { id: 'jigawa', name: 'Jigawa', value: 'jigawa' },
      { id: 'kaduna', name: 'Kaduna', value: 'kaduna' },
      { id: 'kano', name: 'Kano', value: 'kano' },
      { id: 'katsina', name: 'Katsina', value: 'katsina' },
      { id: 'kebbi', name: 'Kebbi', value: 'kebbi' },
      { id: 'kogi', name: 'Kogi', value: 'kogi' },
      { id: 'kwara', name: 'Kwara', value: 'kwara' },
      { id: 'lagos', name: 'Lagos', value: 'lagos' },
      { id: 'nasarawa', name: 'Nasarawa', value: 'nasarawa' },
      { id: 'niger', name: 'Niger', value: 'niger' },
      { id: 'ogun', name: 'Ogun', value: 'ogun' },
      { id: 'ondo', name: 'Ondo', value: 'ondo' },
      { id: 'osun', name: 'Osun', value: 'osun' },
      { id: 'oyo', name: 'Oyo', value: 'oyo' },
      { id: 'plateau', name: 'Plateau', value: 'plateau' },
      { id: 'rivers', name: 'Rivers', value: 'rivers' },
      { id: 'sokoto', name: 'Sokoto', value: 'sokoto' },
      { id: 'taraba', name: 'Taraba', value: 'taraba' },
      { id: 'yobe', name: 'Yobe', value: 'yobe' },
      { id: 'zamfara', name: 'Zamfara', value: 'zamfara' }
    ];
  }

  // Format name for display
  formatName(name) {
    if (!name) return '';
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Clear cache
  clearCache() {
    this.cache.states = null;
    this.cache.localGovernments.clear();
    this.cache.wards.clear();
    this.cache.pollingUnits.clear();
    console.log('🗑️ Location cache cleared');
  }

  // Get location hierarchy (state -> lga -> ward -> polling unit)
  async getLocationHierarchy() {
    try {
      const states = await this.getStates();
      return {
        states,
        totalStates: states.length
      };
    } catch (error) {
      console.error('❌ Error getting location hierarchy:', error);
      return {
        states: this.getFallbackStates(),
        totalStates: 37
      };
    }
  }

  // Search locations using optimized data
  searchLocations(query, type = 'all') {
    try {
      return optimizedLocationService.searchLocations(query, type);
    } catch (error) {
      console.error('❌ Error searching locations:', error);
      return [];
    }
  }

  // Get location statistics
  getLocationStats() {
    try {
      return optimizedLocationService.getStats();
    } catch (error) {
      console.error('❌ Error getting location stats:', error);
      return {
        totalStates: 37,
        totalLGAs: 774,
        totalWards: 8739,
        totalPollingUnits: 101744
      };
    }
  }
}

// Export singleton instance
export const apiLocationService = new APILocationService();
export default apiLocationService;
