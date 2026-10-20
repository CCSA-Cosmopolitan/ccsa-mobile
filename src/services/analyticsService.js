import { auth } from './firebase';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ No authenticated user found in analyticsService');
    throw new Error('User not authenticated');
  }
  try {
    const token = await user.getIdToken(true); // Force refresh
    console.log('✅ Got analytics auth token, length:', token.length);
    return token;
  } catch (error) {
    console.error('❌ Error getting analytics auth token:', error);
    throw new Error('Failed to get authentication token');
  }
};

// Fallback stats for when API is unavailable
const getFallbackStats = () => ({
  totalFarmers: 0,
  farmersThisMonth: 0,
  farmersThisWeek: 0,
  farmersToday: 0,
  pendingVerification: 0,
  approvedFarmers: 0,
  rejectedFarmers: 0,
});

export const analyticsService = {
  async getAgentStats() {
    try {
      console.log('🔍 Fetching agent statistics...');
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('❌ No authenticated user for analytics');
        return getFallbackStats();
      }

      const token = await getAuthToken();
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('⏰ Analytics request timed out after 10 seconds');
      }, 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/api/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📊 Analytics response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Analytics API Error:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        
        // Return fallback stats instead of throwing
        console.log('📊 Returning fallback stats due to API error');
        return getFallbackStats();
      }

      const data = await response.json();
      console.log('✅ Analytics data received:', data);
      
      // Ensure all required fields exist
      return {
        totalFarmers: data.totalFarmers || 0,
        farmersThisMonth: data.farmersThisMonth || 0,
        farmersThisWeek: data.farmersThisWeek || 0,
        farmersToday: data.farmersToday || 0,
        pendingVerification: data.pendingVerification || 0,
        approvedFarmers: data.approvedFarmers || 0,
        rejectedFarmers: data.rejectedFarmers || 0,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Analytics request was aborted (timeout)');
      } else {
        console.error('❌ Analytics service error:', error);
      }
      
      // Return fallback stats instead of throwing
      console.log('📊 Returning fallback stats due to service error');
      return getFallbackStats();
    }
  },

  // Test API connectivity
  async testApiConnection() {
    try {
      console.log('🌐 Testing API connectivity...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ API connectivity test passed');
        return true;
      } else {
        console.log(`❌ API connectivity test failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ API connectivity test failed:', error.message);
      return false;
    }
  },
};
