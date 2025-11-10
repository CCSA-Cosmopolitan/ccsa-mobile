import { auth } from './firebase';
import API_CONFIG from '../config/api';
import { offlineCacheService } from './offlineCacheService';

class ClusterService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    console.log('🔧 ClusterService initialized with BASE_URL:', this.baseURL);
  }

  /**
   * Get authentication token from Firebase Auth
   */
  async getAuthToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all clusters
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Clusters data with pagination
   */
  async getClusters(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const endpoint = `/api/clusters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const fullUrl = `${this.baseURL}${endpoint}`;
      
      console.log('🌐 Fetching clusters from:', fullUrl);
      
      // Make unauthenticated request for GET - clusters are public
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Clusters received:', data.clusters?.length || 0);
      
      return {
        clusters: data.clusters || [],
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || 1,
      };
    } catch (error) {
      console.error('❌ Error fetching clusters:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        baseURL: this.baseURL
      });
      throw new Error(`Failed to fetch clusters: ${error.message}`);
    }
  }

  /**
   * Get clusters formatted for dropdown/picker
   * @returns {Promise<Array>} Array of cluster options
   */


  async getClustersForDropdown(forceRefresh = false) {
    try {
      console.log('📋 Getting clusters for dropdown...');
      
      // Use cache service for offline support
      const formattedClusters = await offlineCacheService.fetchWithCache(
        '@cache_clusters_dropdown',
        async () => {
          const data = await this.getClusters({ limit: 100 });
          
          console.log('📊 Formatting', data.clusters.length, 'clusters for dropdown');
          
          const formatted = data.clusters.map(cluster => ({
            label: cluster.title || 'Unnamed Cluster',
            value: cluster.id || cluster._id || '',
            clusterLead: cluster.clusterLeadFirstName && cluster.clusterLeadLastName 
              ? `${cluster.clusterLeadFirstName} ${cluster.clusterLeadLastName}`
              : 'No Lead Assigned',
            farmerCount: cluster._count?.farmers || 0,
          }));
          
          return formatted;
        },
        7 * 24 * 60 * 60 * 1000, // 7 days expiry (clusters rarely change)
        forceRefresh
      );
      
      console.log('✅ Formatted clusters:', formattedClusters.length);
      return formattedClusters;
    } catch (error) {
      console.error('❌ Error fetching clusters for dropdown:', error);
      
      // Try to get cached data as fallback
      const cached = await offlineCacheService.getCache('@cache_clusters_dropdown', null);
      if (cached) {
        console.log('✅ Using cached clusters after error');
        return cached;
      }
      
      throw new Error(`Failed to load clusters: ${error.message}`);
    }
  }

  /**
   * Get a specific cluster by ID
   * @param {string} clusterId - Cluster ID
   * @returns {Promise<Object>} Cluster data
   */
  async getClusterById(clusterId) {
    try {
      if (!clusterId) {
        throw new Error('Cluster ID is required');
      }

      const data = await this.makeAuthenticatedRequest(`/api/clusters/${clusterId}`);
      
      return data.cluster;
    } catch (error) {
      console.error(`Error fetching cluster ${clusterId}:`, error);
      throw new Error(`Failed to fetch cluster: ${error.message}`);
    }
  }

  /**
   * Create a new cluster
   * @param {Object} clusterData - Cluster data
   * @returns {Promise<Object>} Created cluster
   */
  async createCluster(clusterData) {
    try {
      const requiredFields = ['title', 'clusterLeadFirstName', 'clusterLeadLastName', 'clusterLeadEmail', 'clusterLeadPhone'];
      
      for (const field of requiredFields) {
        if (!clusterData[field]?.trim()) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clusterData.clusterLeadEmail)) {
        throw new Error('Invalid email format');
      }

      const data = await this.makeAuthenticatedRequest('/api/clusters', {
        method: 'POST',
        body: JSON.stringify(clusterData),
      });

      return data.cluster;
    } catch (error) {
      console.error('Error creating cluster:', error);
      throw new Error(`Failed to create cluster: ${error.message}`);
    }
  }

  /**
   * Update an existing cluster
   * @param {string} clusterId - Cluster ID
   * @param {Object} clusterData - Updated cluster data
   * @returns {Promise<Object>} Updated cluster
   */
  async updateCluster(clusterId, clusterData) {
    try {
      if (!clusterId) {
        throw new Error('Cluster ID is required');
      }

      const data = await this.makeAuthenticatedRequest(`/api/clusters/${clusterId}`, {
        method: 'PUT',
        body: JSON.stringify(clusterData),
      });

      return data.cluster;
    } catch (error) {
      console.error(`Error updating cluster ${clusterId}:`, error);
      throw new Error(`Failed to update cluster: ${error.message}`);
    }
  }

  /**
   * Delete a cluster
   * @param {string} clusterId - Cluster ID
   * @returns {Promise<void>}
   */
  async deleteCluster(clusterId) {
    try {
      if (!clusterId) {
        throw new Error('Cluster ID is required');
      }

      await this.makeAuthenticatedRequest(`/api/clusters/${clusterId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Error deleting cluster ${clusterId}:`, error);
      throw new Error(`Failed to delete cluster: ${error.message}`);
    }
  }

  /**
   * Search clusters by title or description
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching clusters
   */
  async searchClusters(searchTerm) {
    try {
      if (!searchTerm?.trim()) {
        return [];
      }

      const data = await this.getClusters({ search: searchTerm.trim() });
      return data.clusters;
    } catch (error) {
      console.error('Error searching clusters:', error);
      throw new Error(`Failed to search clusters: ${error.message}`);
    }
  }

  /**
   * Get cluster statistics
   * @returns {Promise<Object>} Cluster statistics
   */
  async getClusterStats() {
    try {
      const data = await this.getClusters({ limit: 1000 }); // Get all for stats
      
      const totalClusters = data.totalCount;
      const totalFarmers = data.clusters.reduce((sum, cluster) => 
        sum + (cluster._count?.farmers || 0), 0
      );
      
      const avgFarmersPerCluster = totalClusters > 0 ? totalFarmers / totalClusters : 0;
      
      return {
        totalClusters,
        totalFarmers,
        avgFarmersPerCluster: Math.round(avgFarmersPerCluster * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting cluster stats:', error);
      throw new Error(`Failed to get cluster statistics: ${error.message}`);
    }
  }

  /**
   * Refresh clusters cache (if any caching is implemented)
   * @returns {Promise<void>}
   */
  async refreshClusters() {
    try {
      // For now, just re-fetch data
      // In the future, this could clear any local cache
      await this.getClusters();
    } catch (error) {
      console.error('Error refreshing clusters:', error);
      throw error;
    }
  }
}

export default new ClusterService();
