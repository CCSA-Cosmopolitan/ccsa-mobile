import { auth } from './firebase';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Fallback URLs to try if primary fails
const FALLBACK_URLS = [
  'http://172.20.10.4:3000',
  'http://172.20.10.4:3000',
  'http://172.20.10.4:3000'
];

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ No authenticated user found in getAuthToken');
    throw new Error('User not authenticated');
  }
  try {
    const token = await user.getIdToken(true); // Force refresh
    console.log('✅ Got auth token, length:', token.length);
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    throw error;
  }
};

// Function to find a working API endpoint
const findWorkingEndpoint = async () => {
  const endpoints = [API_BASE_URL, ...FALLBACK_URLS.filter(url => url !== API_BASE_URL)];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      const healthUrl = endpoint.replace('/api', '') + '/api/health';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Working endpoint found: ${endpoint}`);
        return endpoint;
      }
    } catch (error) {
      console.log(`❌ Endpoint failed: ${endpoint} - ${error.message}`);
    }
  }
  
  throw new Error('No working API endpoints found. Please check your internet connection.');
};

const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    console.log('🔍 Starting makeAuthenticatedRequest');
    console.log('🌐 Original URL:', url);
    
    // if (DEBUG_NETWORK) {
    //   await networkDebug.checkConnectivity();
    // }
    
    // Check network connectivity first
    try {
      console.log('🔍 Testing basic network connectivity...');
      const testResponse = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      console.log('✅ Basic network connectivity OK');
    } catch (netError) {
      console.error('❌ Network connectivity test failed:', netError);
      throw new Error('No internet connection available');
    }
    
    // Find working endpoint if URL contains the base URL
    let finalUrl = url;
    if (url.includes(API_BASE_URL)) {
      try {
        const workingEndpoint = await findWorkingEndpoint();
        finalUrl = url.replace(API_BASE_URL, workingEndpoint);
        console.log('🔄 Updated URL to working endpoint:', finalUrl);
      } catch (error) {
        console.warn('⚠️ Could not find working endpoint, using original URL');
      }
    }
    
    const token = await getAuthToken();
    console.log('🌐 Making request to:', finalUrl);
    console.log('🔑 Using token (first 20 chars):', token.substring(0, 20) + '...');
    
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };
    
    console.log('📋 Request method:', requestOptions.method || 'GET');
    
    const response = await fetch(finalUrl, requestOptions);
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response URL:', response.url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.log('❌ API Error Response:', errorData);
      
      // Create a more detailed error
      const error = new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    return response.json();
  } catch (error) {
    console.error('❌ makeAuthenticatedRequest error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    throw error;
  }
};

export const farmerService = {
  async createFarmer(farmerData) {
    const url = `${API_BASE_URL}/api/mobile/farmers`;
    const data = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(farmerData),
    });
    return data;
  },

  async getFarmers(page = 1, limit = 100, search = '', state = '', cluster = '', status = '', loadAll = false) {
    console.log('🔍 farmerService.getFarmers called with:', { page, limit, search, state, cluster, status, loadAll });
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(state && { state }),
      ...(cluster && { cluster }),
      ...(status && { status }),
      ...(loadAll && { loadAll: 'true' }),
    });
    
    const url = `${API_BASE_URL}/api/mobile/farmers?${queryParams}`;
    console.log('🔍 Fetching from URL:', url);
    
    try {
      const data = await makeAuthenticatedRequest(url);
      console.log('🔍 Raw API response:', data);
      console.log('🔍 Response type:', typeof data);
      console.log('🔍 Response keys:', Object.keys(data || {}));
      
      if (data?.farmers) {
        console.log(`🔍 Loaded ${data.farmers.length} farmers${loadAll ? ' (ALL)' : ''}`);
        console.log('🔍 First farmer sample:', data.farmers[0]);
        console.log('🔍 Pagination:', data.pagination);
      }
      
      return data;
    } catch (error) {
      console.error('🔍 Error in getFarmers:', error);
      throw error;
    }
  },

  async getFarmerById(id) {
    const url = `${API_BASE_URL}/api/mobile/farmers/${id}`;
    const data = await makeAuthenticatedRequest(url);
    return data;
  },

  async getFarmerByNin(nin) {
    const url = `${API_BASE_URL}/api/mobile/farmers?nin=${encodeURIComponent(nin)}&limit=1`;
    const data = await makeAuthenticatedRequest(url);
    return data.farmers?.[0] || null;
  },

  async searchFarmers(query, type = 'all') {
    const queryParams = new URLSearchParams({
      query,
      ...(type !== 'all' && { type }),
    });
    
    const url = `${API_BASE_URL}/api/mobile/farmers?${queryParams}`;
    const data = await makeAuthenticatedRequest(url);
    return data.farmers || [];
  },

  async updateFarmer(id, updates) {
    const url = `${API_BASE_URL}/api/mobile/farmers/${id}`;
    const data = await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  async deleteFarmer(id) {
    const url = `${API_BASE_URL}/api/mobile/farmers/${id}`;
    await makeAuthenticatedRequest(url, {
      method: 'DELETE',
    });
    return { success: true };
  },

  async checkUniqueFields(nin, email, phone, bvn) {
    // Check NIN and phone separately since the mobile farmers endpoint returns
    // matching records (200) rather than throwing on duplicates.
    const conflicts = [];
    try {
      if (nin) {
        const ninData = await makeAuthenticatedRequest(
          `${API_BASE_URL}/api/mobile/farmers?nin=${encodeURIComponent(nin)}&limit=1`
        );
        if (ninData?.farmers?.length > 0) conflicts.push('NIN already registered');
      }
      if (phone) {
        const phoneData = await makeAuthenticatedRequest(
          `${API_BASE_URL}/api/mobile/farmers?search=${encodeURIComponent(phone)}&limit=1`
        );
        if (phoneData?.farmers?.some(f => f.phone === phone)) {
          conflicts.push('Phone number already registered');
        }
      }
    } catch (error) {
      console.log('checkUniqueFields error:', error.message);
    }
    return conflicts;
  },
};
