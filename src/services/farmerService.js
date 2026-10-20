import { auth } from './firebase';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthToken = async () => {
  const user = auth?.currentUser;
  if (!user) {
    console.log('❌ No authenticated user found in getAuthToken');
    throw new Error('User not authenticated');
  }
  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    throw error;
  }
};

const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const token = await getAuthToken();

    const controller = new AbortController();
    const timeoutMs = options.timeout || API_CONFIG.TIMEOUT || 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      signal: controller.signal,
    };

    console.log(`🌐 [farmerService] ${requestOptions.method || 'GET'} -> ${url}`);

    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('❌ API Error Response:', response.status, errorData);
      
      const error = new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Network request timed out. Please check your internet connection.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    console.error('❌ makeAuthenticatedRequest error:', error?.message || error);
    throw error;
  }
};

export const farmerService = {
  async createFarmer(farmerData) {
    const url = `${API_BASE_URL}/api/mobile/farmers`;

    // Transform nested farmerData to flat structure expected by backend
    const payload = {
      nin: farmerData.nin,
      firstName: farmerData.personalInfo?.firstName,
      middleName: farmerData.personalInfo?.middleName,
      lastName: farmerData.personalInfo?.lastName,
      dateOfBirth: farmerData.personalInfo?.dateOfBirth,
      gender: farmerData.personalInfo?.gender,
      maritalStatus: farmerData.personalInfo?.maritalStatus,
      employmentStatus: farmerData.personalInfo?.employmentStatus,
      photoUrl: farmerData.personalInfo?.photoUrl,

      state: farmerData.contactInfo?.state,
      lga: farmerData.contactInfo?.localGovernment,
      ward: farmerData.contactInfo?.ward,
      pollingUnit: farmerData.contactInfo?.pollingUnit,
      clusterId: farmerData.contactInfo?.cluster,
      phone: farmerData.contactInfo?.phoneNumber,
      whatsAppNumber: farmerData.contactInfo?.whatsAppNumber,
      email: farmerData.contactInfo?.email,
      address: farmerData.contactInfo?.address,
      latitude: farmerData.contactInfo?.coordinates?.latitude,
      longitude: farmerData.contactInfo?.coordinates?.longitude,

      bvn: farmerData.bankInfo?.bvn,
      bankName: farmerData.bankInfo?.bankName,
      accountNumber: farmerData.bankInfo?.accountNumber,
      accountName: farmerData.bankInfo?.accountName,

      referees: farmerData.referees?.map(r => {
        const nameParts = (r.fullName || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
        
        return {
          firstName,
          lastName,
          phone: r.phoneNumber,
          relationship: r.relation
        };
      }).filter(r => r.firstName && r.phone)
    };

    const data = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
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
