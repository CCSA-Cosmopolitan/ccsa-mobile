import { auth } from './firebase';
import API_CONFIG from '../config/api';
import { offlineCacheService } from './offlineCacheService';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken();
};

export const farmService = {
  // Create a new farm for a farmer
  async createFarm(farmerId, farmData) {
    try {
      const token = await getAuthToken();
      
      const requestUrl = `${API_BASE_URL}/api/farms`;
      
      const requestBody = {
        farmerId,
        ...farmData
      };
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('Farm creation response status:', response.status);
      console.log('Farm creation response text:', responseText.substring(0, 500)); // Log first 500 chars

      if (!response.ok) {        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          // If JSON parse fails, the server returned HTML (likely an error page)
          console.error('Failed to parse error response as JSON:', parseError);
          console.error('Raw response:', responseText.substring(0, 1000)); // Log more detail
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
        }
      }

    const data = JSON.parse(responseText);
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your network connection and server status');
    }
    
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(`Network error: ${error.message}. Please check if the server is running at ${API_BASE_URL}`);
    }
    
    throw error;
  }
},

  // Get all farms for a farmer (with offline support)
  async getFarmsByFarmer(farmerId, forceRefresh = false) {
    try {
      // Use cache service for offline-first approach
      const farms = await offlineCacheService.fetchWithCache(
        `@cache_farms_${farmerId}`,
        async () => {
          // Fetch from API
          const token = await getAuthToken();
          
          const response = await fetch(`${API_BASE_URL}/api/farms/farmer/${farmerId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch farms');
          }

          const data = await response.json();
          const farmsData = data.farms || [];
          
          // Cache the farms
          await offlineCacheService.cacheFarmsByFarmer(farmerId, farmsData);
          
          return farmsData;
        },
        24 * 60 * 60 * 1000, // 24 hour expiry
        forceRefresh
      );
      
      return farms;
    } catch (error) {
      console.error('Fetch farms error:', error);
      
      // Try to get cached data as fallback
      const cachedFarms = await offlineCacheService.getCachedFarmsByFarmer(farmerId);
      if (cachedFarms) {
        console.log('✅ Using cached farms after error');
        return cachedFarms;
      }
      
      throw error;
    }
  },

  // Update a farm
  async updateFarm(farmId, farmData) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update farm');
      }

      return await response.json();
    } catch (error) {
      console.error('Farm update error:', error);
      throw error;
    }
  },

  // Delete a farm
  async deleteFarm(farmId) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete farm');
      }

      return await response.json();
    } catch (error) {
      console.error('Farm deletion error:', error);
      throw error;
    }
  },

  // Get farm by ID
  async getFarmById(farmId) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch farm');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch farm error:', error);
      throw error;
    }
  },
};
