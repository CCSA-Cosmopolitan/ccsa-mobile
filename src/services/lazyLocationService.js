// Lightweight location service that loads data as needed
// This prevents the large data file from being bundled upfront

// Import the full hierarchical data from local data file
import hierarchicalData from '../data/hierarchical-data.js';

class LazyLocationService {
  constructor() {
    this.cache = {
      states: null,
      lgasByState: new Map(),
      wardsByLga: new Map(),
      pollingUnitsByWard: new Map()
    };
    
    console.log('🚀 LazyLocationService initialized');
  }

  // Get states data (lightweight, can be bundled)
  getStates() {
    if (this.cache.states) {
      return this.cache.states;
    }

    // Lightweight states data that can be bundled
    const states = [
      { id: 'abia', name: 'Abia', code: 'AB', value: 'abia', label: 'Abia' },
      { id: 'adamawa', name: 'Adamawa', code: 'AD', value: 'adamawa', label: 'Adamawa' },
      { id: 'akwa-ibom', name: 'Akwa Ibom', code: 'AI', value: 'akwa-ibom', label: 'Akwa Ibom' },
      { id: 'anambra', name: 'Anambra', code: 'AN', value: 'anambra', label: 'Anambra' },
      { id: 'bauchi', name: 'Bauchi', code: 'BA', value: 'bauchi', label: 'Bauchi' },
      { id: 'bayelsa', name: 'Bayelsa', code: 'BY', value: 'bayelsa', label: 'Bayelsa' },
      { id: 'benue', name: 'Benue', code: 'BE', value: 'benue', label: 'Benue' },
      { id: 'borno', name: 'Borno', code: 'BO', value: 'borno', label: 'Borno' },
      { id: 'cross-river', name: 'Cross River', code: 'CR', value: 'cross-river', label: 'Cross River' },
      { id: 'delta', name: 'Delta', code: 'DE', value: 'delta', label: 'Delta' },
      { id: 'ebonyi', name: 'Ebonyi', code: 'EB', value: 'ebonyi', label: 'Ebonyi' },
      { id: 'edo', name: 'Edo', code: 'ED', value: 'edo', label: 'Edo' },
      { id: 'ekiti', name: 'Ekiti', code: 'EK', value: 'ekiti', label: 'Ekiti' },
      { id: 'enugu', name: 'Enugu', code: 'EN', value: 'enugu', label: 'Enugu' },
      { id: 'abuja', name: 'FCT - Abuja', code: 'FC', value: 'abuja', label: 'FCT - Abuja' },
      { id: 'gombe', name: 'Gombe', code: 'GO', value: 'gombe', label: 'Gombe' },
      { id: 'imo', name: 'Imo', code: 'IM', value: 'imo', label: 'Imo' },
      { id: 'jigawa', name: 'Jigawa', code: 'JI', value: 'jigawa', label: 'Jigawa' },
      { id: 'kaduna', name: 'Kaduna', code: 'KD', value: 'kaduna', label: 'Kaduna' },
      { id: 'kano', name: 'Kano', code: 'KN', value: 'kano', label: 'Kano' },
      { id: 'katsina', name: 'Katsina', code: 'KT', value: 'katsina', label: 'Katsina' },
      { id: 'kebbi', name: 'Kebbi', code: 'KE', value: 'kebbi', label: 'Kebbi' },
      { id: 'kogi', name: 'Kogi', code: 'KO', value: 'kogi', label: 'Kogi' },
      { id: 'kwara', name: 'Kwara', code: 'KW', value: 'kwara', label: 'Kwara' },
      { id: 'lagos', name: 'Lagos', code: 'LA', value: 'lagos', label: 'Lagos' },
      { id: 'nasarawa', name: 'Nasarawa', code: 'NA', value: 'nasarawa', label: 'Nasarawa' },
      { id: 'niger', name: 'Niger', code: 'NI', value: 'niger', label: 'Niger' },
      { id: 'ogun', name: 'Ogun', code: 'OG', value: 'ogun', label: 'Ogun' },
      { id: 'ondo', name: 'Ondo', code: 'ON', value: 'ondo', label: 'Ondo' },
      { id: 'osun', name: 'Osun', code: 'OS', value: 'osun', label: 'Osun' },
      { id: 'oyo', name: 'Oyo', code: 'OY', value: 'oyo', label: 'Oyo' },
      { id: 'plateau', name: 'Plateau', code: 'PL', value: 'plateau', label: 'Plateau' },
      { id: 'rivers', name: 'Rivers', code: 'RI', value: 'rivers', label: 'Rivers' },
      { id: 'sokoto', name: 'Sokoto', code: 'SO', value: 'sokoto', label: 'Sokoto' },
      { id: 'taraba', name: 'Taraba', code: 'TA', value: 'taraba', label: 'Taraba' },
      { id: 'yobe', name: 'Yobe', code: 'YO', value: 'yobe', label: 'Yobe' },
      { id: 'zamfara', name: 'Zamfara', code: 'ZA', value: 'zamfara', label: 'Zamfara' }
    ];

    this.cache.states = states;
    console.log('🏛️ LazyLocationService: Loaded states from bundle:', states.length);
    return states;
  }

  // Get LGAs for a state (loaded from JSON files as needed)
  async getLGAs(stateId) {
    if (!stateId) return [];

    // Check cache first
    if (this.cache.lgasByState.has(stateId)) {
      return this.cache.lgasByState.get(stateId);
    }

    try {
      console.log(`🏘️ LazyLocationService: Loading LGAs for state ${stateId}`);
      
      // Try to load from local JSON files first
      const lgaData = await this.loadLGAsFromAssets(stateId);
      
      // Transform to expected format
      const transformedLGAs = lgaData.map(lga => ({
        id: lga.id || lga.value || lga.name.toLowerCase().replace(/\s+/g, '-'),
        name: lga.name,
        value: lga.id || lga.value || lga.name.toLowerCase().replace(/\s+/g, '-'),
        label: lga.name,
        stateId
      }));

      this.cache.lgasByState.set(stateId, transformedLGAs);
      console.log(`✅ LazyLocationService: Loaded ${transformedLGAs.length} LGAs for ${stateId}`);
      return transformedLGAs;
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading LGAs for ${stateId}:`, error);
      
      // Fallback: return sample data to prevent crashes
      const fallbackLGAs = this.getFallbackLGAs(stateId);
      this.cache.lgasByState.set(stateId, fallbackLGAs);
      return fallbackLGAs;
    }
  }

  // Load LGAs from the main data file
  async loadLGAsFromAssets(stateId) {
    try {
      // Use the imported hierarchical data
      const data = hierarchicalData;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Hierarchical data file is invalid');
      }
      
      // Normalize stateId to lowercase for matching
      const normalizedStateId = stateId.toLowerCase();
      
      // Find the state data
      const stateData = data.find(s => s.state === normalizedStateId);
      
      if (!stateData || !stateData.lgas) {
        throw new Error(`State '${stateId}' not found or has no LGAs`);
      }
      
      // Transform to expected format
      const lgaData = stateData.lgas.map(lga => ({
        id: lga.lga,
        name: this.formatName(lga.lga),
        value: lga.lga,
        label: this.formatName(lga.lga)
      }));
      
      console.log(`📁 LazyLocationService: Loaded ${lgaData.length} LGAs for ${stateId} from hierarchical data file`);
      return lgaData;
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading from hierarchical data file:`, error);
      
      // Fallback: try to load from lgas-by-state.json  
      try {
        const response = await fetch('/assets/location/lgas-by-state.json');
        if (response.ok) {
          const data = await response.json();
          return data[stateId] || [];
        }
      } catch (fallbackError) {
        console.warn('LazyLocationService: Fallback loading also failed:', fallbackError);
      }

      throw new Error('Could not load LGA data from any source');
    }
  }

  // Get wards for an LGA (loaded as needed)
  async getWards(lgaId) {
    if (!lgaId) return [];

    // Check cache first
    if (this.cache.wardsByLga.has(lgaId)) {
      return this.cache.wardsByLga.get(lgaId);
    }

    try {
      console.log(`🏡 LazyLocationService: Loading wards for LGA ${lgaId}`);
      
      // Load wards from the hierarchical data
      const wardData = await this.loadWardsFromHierarchicalData(lgaId);
      
      // Transform to expected format
      const transformedWards = wardData.map(ward => ({
        id: ward.ward,
        name: this.formatName(ward.ward),
        value: ward.ward,
        label: this.formatName(ward.ward),
        lgaId
      }));

      this.cache.wardsByLga.set(lgaId, transformedWards);
      console.log(`✅ LazyLocationService: Loaded ${transformedWards.length} wards for ${lgaId}`);
      return transformedWards;
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading wards for ${lgaId}:`, error);
      
      // Fallback: return sample data
      const fallbackWards = this.getFallbackWards(lgaId);
      this.cache.wardsByLga.set(lgaId, fallbackWards);
      return fallbackWards;
    }
  }

  // Load wards from hierarchical data
  async loadWardsFromHierarchicalData(lgaId) {
    try {
      const data = hierarchicalData;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Hierarchical data is invalid');
      }
      
      // Normalize lgaId to lowercase and replace spaces with hyphens for matching
      const normalizedLgaId = lgaId.toLowerCase().replace(/\s+/g, '-');
      
      // Find the LGA across all states
      for (const state of data) {
        if (state.lgas) {
          const lga = state.lgas.find(l => l.lga === normalizedLgaId);
          if (lga && lga.wards) {
            console.log(`📁 LazyLocationService: Found ${lga.wards.length} wards for LGA ${lgaId} in state ${state.state}`);
            return lga.wards;
          }
        }
      }
      
      throw new Error(`LGA '${lgaId}' not found in hierarchical data`);
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading wards from hierarchical data:`, error);
      throw error;
    }
  }

  // Get polling units for a ward (loaded as needed)
  async getPollingUnits(wardId) {
    if (!wardId) return [];

    // Check cache first
    if (this.cache.pollingUnitsByWard.has(wardId)) {
      return this.cache.pollingUnitsByWard.get(wardId);
    }

    try {
      console.log(`🗳️ LazyLocationService: Loading polling units for ward ${wardId}`);
      
      // Load polling units from hierarchical data
      const pollingUnitsData = await this.loadPollingUnitsFromHierarchicalData(wardId);
      
      // Transform to expected format
      const transformedPollingUnits = pollingUnitsData.map((unit, index) => ({
        id: unit,
        name: this.formatPollingUnit(unit),
        value: unit,
        label: this.formatPollingUnit(unit),
        wardId
      }));
      
      this.cache.pollingUnitsByWard.set(wardId, transformedPollingUnits);
      console.log(`✅ LazyLocationService: Loaded ${transformedPollingUnits.length} polling units for ${wardId}`);
      return transformedPollingUnits;
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading polling units for ${wardId}:`, error);
      
      // Fallback: return sample data
      const fallbackPollingUnits = this.getFallbackPollingUnits(wardId);
      this.cache.pollingUnitsByWard.set(wardId, fallbackPollingUnits);
      return fallbackPollingUnits;
    }
  }

  // Load polling units from hierarchical data
  async loadPollingUnitsFromHierarchicalData(wardId) {
    try {
      const data = hierarchicalData;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Hierarchical data is invalid');
      }
      
      // Normalize wardId to lowercase and replace spaces with hyphens for matching
      const normalizedWardId = wardId.toLowerCase().replace(/\s+/g, '-');
      
      // Find the ward across all states and LGAs
      for (const state of data) {
        if (state.lgas) {
          for (const lga of state.lgas) {
            if (lga.wards) {
              const ward = lga.wards.find(w => w.ward === normalizedWardId);
              if (ward && ward.polling_units) {
                console.log(`📁 LazyLocationService: Found ${ward.polling_units.length} polling units for ward ${wardId} in LGA ${lga.lga}, state ${state.state}`);
                return ward.polling_units;
              }
            }
          }
        }
      }
      
      throw new Error(`Ward '${wardId}' not found in hierarchical data`);
      
    } catch (error) {
      console.error(`❌ LazyLocationService: Error loading polling units from hierarchical data:`, error);
      throw error;
    }
  }

  // Fallback LGA data for major states
  getFallbackLGAs(stateId) {
    const fallbackData = {
      'abia': [
        { id: 'aba-north', name: 'Aba North', value: 'aba-north', label: 'Aba North' },
        { id: 'aba-south', name: 'Aba South', value: 'aba-south', label: 'Aba South' },
        { id: 'arochukwu', name: 'Arochukwu', value: 'arochukwu', label: 'Arochukwu' },
        { id: 'bende', name: 'Bende', value: 'bende', label: 'Bende' },
        { id: 'ikwuano', name: 'Ikwuano', value: 'ikwuano', label: 'Ikwuano' },
        { id: 'isiala-ngwa-north', name: 'Isiala Ngwa North', value: 'isiala-ngwa-north', label: 'Isiala Ngwa North' },
        { id: 'isiala-ngwa-south', name: 'Isiala Ngwa South', value: 'isiala-ngwa-south', label: 'Isiala Ngwa South' },
        { id: 'isuikwuato', name: 'Isuikwuato', value: 'isuikwuato', label: 'Isuikwuato' },
        { id: 'obi-ngwa', name: 'Obi Ngwa', value: 'obi-ngwa', label: 'Obi Ngwa' },
        { id: 'ohafia', name: 'Ohafia', value: 'ohafia', label: 'Ohafia' },
        { id: 'osisioma', name: 'Osisioma', value: 'osisioma', label: 'Osisioma' },
        { id: 'ugwunagbo', name: 'Ugwunagbo', value: 'ugwunagbo', label: 'Ugwunagbo' },
        { id: 'ukwa-east', name: 'Ukwa East', value: 'ukwa-east', label: 'Ukwa East' },
        { id: 'ukwa-west', name: 'Ukwa West', value: 'ukwa-west', label: 'Ukwa West' },
        { id: 'umuahia-north', name: 'Umuahia North', value: 'umuahia-north', label: 'Umuahia North' },
        { id: 'umuahia-south', name: 'Umuahia South', value: 'umuahia-south', label: 'Umuahia South' },
        { id: 'umu-nneochi', name: 'Umu Nneochi', value: 'umu-nneochi', label: 'Umu Nneochi' }
      ],
      'lagos': [
        { id: 'agege', name: 'Agege', value: 'agege', label: 'Agege' },
        { id: 'ajeromi-ifelodun', name: 'Ajeromi-Ifelodun', value: 'ajeromi-ifelodun', label: 'Ajeromi-Ifelodun' },
        { id: 'alimosho', name: 'Alimosho', value: 'alimosho', label: 'Alimosho' },
        { id: 'amuwo-odofin', name: 'Amuwo-Odofin', value: 'amuwo-odofin', label: 'Amuwo-Odofin' },
        { id: 'apapa', name: 'Apapa', value: 'apapa', label: 'Apapa' },
        { id: 'badagry', name: 'Badagry', value: 'badagry', label: 'Badagry' },
        { id: 'epe', name: 'Epe', value: 'epe', label: 'Epe' },
        { id: 'eti-osa', name: 'Eti-Osa', value: 'eti-osa', label: 'Eti-Osa' },
        { id: 'ibeju-lekki', name: 'Ibeju-Lekki', value: 'ibeju-lekki', label: 'Ibeju-Lekki' },
        { id: 'ifako-ijaiye', name: 'Ifako-Ijaiye', value: 'ifako-ijaiye', label: 'Ifako-Ijaiye' },
        { id: 'ikeja', name: 'Ikeja', value: 'ikeja', label: 'Ikeja' },
        { id: 'ikorodu', name: 'Ikorodu', value: 'ikorodu', label: 'Ikorodu' },
        { id: 'kosofe', name: 'Kosofe', value: 'kosofe', label: 'Kosofe' },
        { id: 'lagos-island', name: 'Lagos Island', value: 'lagos-island', label: 'Lagos Island' },
        { id: 'lagos-mainland', name: 'Lagos Mainland', value: 'lagos-mainland', label: 'Lagos Mainland' },
        { id: 'mushin', name: 'Mushin', value: 'mushin', label: 'Mushin' },
        { id: 'ojo', name: 'Ojo', value: 'ojo', label: 'Ojo' },
        { id: 'oshodi-isolo', name: 'Oshodi-Isolo', value: 'oshodi-isolo', label: 'Oshodi-Isolo' },
        { id: 'shomolu', name: 'Shomolu', value: 'shomolu', label: 'Shomolu' },
        { id: 'surulere', name: 'Surulere', value: 'surulere', label: 'Surulere' }
      ]
    };

    return fallbackData[stateId] || [
      { id: `${stateId}-lga-1`, name: `${stateId.charAt(0).toUpperCase() + stateId.slice(1)} LGA 1`, value: `${stateId}-lga-1`, label: `${stateId.charAt(0).toUpperCase() + stateId.slice(1)} LGA 1` },
      { id: `${stateId}-lga-2`, name: `${stateId.charAt(0).toUpperCase() + stateId.slice(1)} LGA 2`, value: `${stateId}-lga-2`, label: `${stateId.charAt(0).toUpperCase() + stateId.slice(1)} LGA 2` }
    ];
  }

  // Fallback ward data
  getFallbackWards(lgaId) {
    return [
      { id: `${lgaId}-ward-1`, name: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 1`, value: `${lgaId}-ward-1`, label: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 1` },
      { id: `${lgaId}-ward-2`, name: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 2`, value: `${lgaId}-ward-2`, label: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 2` },
      { id: `${lgaId}-ward-3`, name: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 3`, value: `${lgaId}-ward-3`, label: `${lgaId.charAt(0).toUpperCase() + lgaId.slice(1)} Ward 3` }
    ];
  }

  // Fallback polling unit data
  getFallbackPollingUnits(wardId) {
    return [
      { id: `${wardId}-pu-001`, name: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 001`, value: `${wardId}-pu-001`, label: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 001` },
      { id: `${wardId}-pu-002`, name: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 002`, value: `${wardId}-pu-002`, label: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 002` },
      { id: `${wardId}-pu-003`, name: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 003`, value: `${wardId}-pu-003`, label: `${wardId.charAt(0).toUpperCase() + wardId.slice(1)} PU 003` }
    ];
  }

  // Format names from kebab-case to Title Case
  formatName(name) {
    if (!name) return '';
    
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Format polling unit in sentence case without hyphens
  formatPollingUnit(text) {
    if (!text) return 'N/A';
    const cleaned = text.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'N/A';
    let result = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    result = result.replace(/\b(i{1,3}|iv|v|vi{1,3}|ix|x)\b/gi, (m) => m.toUpperCase());
    return result;
  }

  // Get location statistics
  getLocationStats() {
    return {
      totalStates: 37,
      totalLGAs: 774,
      totalWards: 8812,
      totalPollingUnits: 176846,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Create and export a single instance
export const lazyLocationService = new LazyLocationService();
