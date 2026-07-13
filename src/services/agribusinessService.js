import API_CONFIG from '../config/api';
import { auth } from './firebase';

export const agribusinessService = {
  /**
   * Submit a new agribusiness lead
   * @param {Object} data Agribusiness form data
   */
  submitAgribusinessLead: async (data) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AGRIBUSINESS_MOBILE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to submit lead');
      }

      return responseData;
    } catch (error) {
      console.error('Error in submitAgribusinessLead:', error);
      throw error;
    }
  },

  /**
   * Extract KYB info from image using AI
   * @param {string} imageBase64 Base64 encoded image string
   */
  extractKybFromImage: async (imageBase64) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXTRACT_KYB}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageBase64 })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to extract document information');
      }

      return responseData;
    } catch (error) {
      console.error('Error in extractKybFromImage:', error);
      throw error;
    }
  }
};
