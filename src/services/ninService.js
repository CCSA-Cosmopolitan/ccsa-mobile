import { auth } from './firebase';
import { logger } from '../utils/secureLogger';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Network timeout configuration
const NETWORK_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 2;

// Helper function to parse date in dd-mm-yyyy format
const parseNINDate = (dateString) => {
  if (!dateString) return '';
  
  // Handle dd-mm-yyyy format
  const datePattern = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = dateString.match(datePattern);
  
  if (match) {
    const [, day, month, year] = match;
    // Convert to ISO format (yyyy-mm-dd)
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it doesn't match dd-mm-yyyy, try to parse as-is
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // Return yyyy-mm-dd format
  }
  
  console.warn(`Could not parse date: ${dateString}`);
  return '';
};

// Helper function to create fetch with timeout
const fetchWithTimeout = async (url, options, timeout = NETWORK_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

// Helper function to retry network requests
const retryNetworkRequest = async (requestFn, maxAttempts = RETRY_ATTEMPTS) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`� NIN API attempt ${attempt}/${maxAttempts}`);
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Don't retry for authentication or validation errors
      if (error.message.includes('authenticated') || 
          error.message.includes('11 digits') ||
          error.message.includes('Invalid response format') ||
          error.message.includes('NIN not found') ||
          error.message.includes('Authentication failed')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

const getAuthToken = async () => {
  const user = auth.currentUser;
  console.log('� Current user:', user ? 'User logged in' : 'No user logged in');
  if (!user) throw new Error('User not authenticated');
  
  // Force refresh the token to ensure it's valid
  const token = await user.getIdToken(true);
  console.log('🔑 Token obtained, length:', token ? token.length : 'No token');
  
  return token;
};

export const ninService = {
  // Lookup NIN information using the real API structure
  async lookupNIN(nin) {
    try {
      console.log('=== NIN LOOKUP START ===');
      console.log('🔍 NIN provided:', nin ? '****masked****' : 'null');
      console.log('🌐 Using API_BASE_URL:', API_BASE_URL);
      
      if (!nin || nin.length !== 11) {
        throw new Error('NIN must be exactly 11 digits');
      }
      
      // Wrap the lookup logic in retry mechanism
      return await retryNetworkRequest(async () => {
        // First try the temp endpoint for testing
        const tempUrl = `${API_BASE_URL}/api/temp-nin/lookup?nin=${nin}`;
        console.log('🔍 Making request to temp endpoint:', tempUrl);
        
        try {
          const tempResponse = await fetchWithTimeout(tempUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log('📊 Temp response status:', tempResponse.status);
          console.log('📊 Temp response headers:', Object.fromEntries(tempResponse.headers.entries()));
          
          if (tempResponse.ok) {
            const result = await tempResponse.json();
            console.log('📊 Temp NIN endpoint raw response:', JSON.stringify(result, null, 2));
            
            if (result.success && result.data) {
              // Destructure the API response based on actual structure
              const {
                firstname,
                middlename,
                surname,
                dateofbirth,
                gender,
                email,
                telephoneno,
                msisdn,
                emplymentstatus,
                educationallevel,
                maritalstatus,
                residence_state,
                residence_lga,
                residence_address,
                birthstate,
                birthlga,
                'residence-address1': residenceAddress1,
                photo,
                signature,
                ...rest
              } = result.data;

              console.log('📋 Destructured fields:', {
                firstname,
                middlename,
                surname,
                dateofbirth,
                gender,
                email,
                telephoneno,
                msisdn,
                emplymentstatus,
                educationallevel,
                maritalstatus,
                residence_state,
                residence_lga,
                residence_address,
                birthstate,
                birthlga,
                residenceAddress1,
                photo: photo ? 'present' : 'null',
                signature: signature ? 'present' : 'null'
              });

              // Map the API response to our form structure (only essential fields)
              const mappedData = {
                nin: nin,
                firstName: firstname || '',
                middleName: middlename || '',
                lastName: surname || '',
                dateOfBirth: parseNINDate(dateofbirth), // Convert to proper format
                gender: gender?.toUpperCase() || '',
                state: birthstate || residence_state || '', // Use birthstate as primary, fallback to residence_state
                lga: birthlga || residence_lga || '', // Use birthlga as primary, fallback to residence_lga
                maritalStatus: maritalstatus || '',
                employmentStatus: emplymentstatus || '',
                photoUrl: photo || '', // Add photo URL from NIN API
                email: email || '',
                phone: telephoneno || msisdn || '',
                educationLevel: educationallevel || '',
                birthState: birthstate || '',
                birthLga: birthlga || '',
                residenceState: residence_state || '',
                residenceLga: residence_lga || '',
                residenceAddress: residence_address || residenceAddress1 || '',
                // Raw data for debugging
                _rawData: result.data
              };

              console.log('📋 Mapped data:', JSON.stringify(mappedData, null, 2));
              console.log('✅ NIN LOOKUP SUCCESS (TEMP ENDPOINT)');
              return mappedData;
            } else {
              throw new Error(result.message || 'No data found for this NIN');
            }
          } else {
            const error = await tempResponse.json().catch(() => ({ message: 'Server error occurred' }));
            console.log('⚠️ Temp endpoint error, trying authenticated endpoint:', error);
            throw new Error('Temp endpoint failed');
          }
        } catch (tempError) {
          console.log('⚠️ Temp endpoint failed, trying authenticated endpoint...');
          
          // Fall back to authenticated endpoint (real NIN API)
          console.log('🔑 Getting auth token...');
          const token = await getAuthToken();
          console.log('� Auth token obtained, making authenticated API request...');
          
          const authUrl = `${API_BASE_URL}/api/nin/lookup?nin=${nin}`;
          console.log('🔍 Making authenticated request to:', authUrl);
          
          const authResponse = await fetchWithTimeout(authUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('📊 Authenticated response status:', authResponse.status);
          console.log('📊 Authenticated response headers:', Object.fromEntries(authResponse.headers.entries()));
          
          if (!authResponse.ok) {
            const authError = await authResponse.json().catch(() => ({ message: 'Server error occurred' }));
         
            
            // Handle specific HTTP status codes
            if (authResponse.status === 404) {
              throw new Error('NIN not found in database');
            } else if (authResponse.status === 401) {
              throw new Error('Authentication failed. Please log out and log in again.');
            } else if (authResponse.status === 403) {
              throw new Error('Access denied. Please contact administrator.');
            } else if (authResponse.status === 429) {
              throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (authResponse.status >= 500) {
              // Check if we have a specific error message about service inactivity
              if (authError.message && (authError.message.toLowerCase().includes('inactive') || authError.message.toLowerCase().includes('suspended'))) {
                throw new Error(authError.message);
              }
              throw new Error('Server error. Please try again later.');
            } else {
              throw new Error(authError.error || authError.message || `Server returned error (${authResponse.status})`);
            }
          }

          const authResult = await authResponse.json();
          console.log('📊 Authenticated API raw response:', JSON.stringify(authResult, null, 2));
          
          if (authResult.success && authResult.data) {
            // Destructure the API response based on actual structure
            const {
              firstname,
              middlename,
              surname,
              dateofbirth,
              gender,
              email,
              telephoneno,
              msisdn,
              emplymentstatus,
              educationallevel,
              maritalstatus,
              residence_state,
              residence_lga,
              residence_address,
              birthstate,
              birthlga,
              'residence-address1': residenceAddress1,
              photo,
              signature,
              ...rest
            } = authResult.data;

            console.log('📋 Destructured fields (auth):', {
              firstname,
              middlename,
              surname,
              dateofbirth,
              gender,
              email,
              telephoneno,
              msisdn,
              emplymentstatus,
              educationallevel,
              maritalstatus,
              residence_state,
              residence_lga,
              residence_address,
              birthstate,
              birthlga,
              residenceAddress1,
              photo: photo ? 'present' : 'null',
              signature: signature ? 'present' : 'null'
            });

            // Map the real API response to our form structure (only essential fields)
            const mappedData = {
              nin: nin,
              firstName: firstname || '',
              middleName: middlename || '',
              lastName: surname || '',
              dateOfBirth: parseNINDate(dateofbirth), // Convert to proper format
              gender: gender?.toUpperCase() || '',
              state: birthstate || residence_state || '', // Use birthstate as primary, fallback to residence_state
              lga: birthlga || residence_lga || '', // Use birthlga as primary, fallback to residence_lga
              maritalStatus: maritalstatus || '',
              employmentStatus: emplymentstatus || '',
              photoUrl: photo || '', // Add photo URL from NIN API
                email: email || '',
                phone: telephoneno || msisdn || '',
                educationLevel: educationallevel || '',
                birthState: birthstate || '',
                birthLga: birthlga || '',
                residenceState: residence_state || '',
                residenceLga: residence_lga || '',
                residenceAddress: residence_address || residenceAddress1 || '',
              // Raw data for debugging
              _rawData: authResult.data
            };

            console.log('📋 Mapped data (auth):', JSON.stringify(mappedData, null, 2));
            console.log('✅ NIN LOOKUP SUCCESS (AUTHENTICATED ENDPOINT)');
            return mappedData;
          } else {
            throw new Error(authResult.message || 'No data found for this NIN');
          }
        }
      });
    } catch (error) {
      console.error('❌ NIN lookup error:', error);
      console.log('=== NIN LOOKUP FAILED ===');
      
      // Provide user-friendly error messages
      let userFriendlyMessage;
      
      if (error.message === 'User not authenticated') {
        userFriendlyMessage = 'Authentication required. Please log in to continue.';
      } else if (error.message.includes('Request timed out')) {
        userFriendlyMessage = 'Request timed out. The server may be slow. Please try again.';
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('Invalid token') || error.message.includes('Authentication failed')) {
        userFriendlyMessage = 'Authentication session expired. Please log out and log in again.';
      } else if (error.message.includes('NIN not found')) {
        userFriendlyMessage = 'This NIN was not found in the database. Please verify the NIN and try again.';
      } else if (error.message.includes('11 digits')) {
        userFriendlyMessage = 'Please enter a valid 11-digit NIN.';
      } else if (error.message.includes('Too many requests')) {
        userFriendlyMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.message.includes('Server error')) {
        userFriendlyMessage = 'Server is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('No data found')) {
        userFriendlyMessage = 'No information found for this NIN. Please verify the NIN is correct.';
      } else {
        // Keep the original message for any other errors
        userFriendlyMessage = error.message || 'An unexpected error occurred during NIN lookup. Please try again.';
      }
      
      // Throw a new error with the user-friendly message
      const friendlyError = new Error(userFriendlyMessage);
      friendlyError.originalError = error;
      throw friendlyError;
    }
  },

  // Test network connectivity to NIN service
  async testConnection() {
    try {
      console.log('🧪 Testing NIN service connectivity...');
      
      // Test the health endpoint first
      const healthUrl = `${API_BASE_URL}/api/health`;
      console.log('🔍 Testing health endpoint:', healthUrl);
      
      const healthResponse = await fetchWithTimeout(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, 10000);

      if (healthResponse.ok) {
        const healthResult = await healthResponse.json();
        console.log('✅ Health endpoint accessible:', healthResult);
        
        return {
          success: true,
          message: 'NIN service is accessible',
          details: {
            endpoint: API_BASE_URL,
            healthCheck: healthResult,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: `Health endpoint returned ${healthResponse.status}`,
          details: {
            endpoint: API_BASE_URL,
            status: healthResponse.status,
            statusText: healthResponse.statusText
          }
        };
      }
    } catch (error) {
      console.error('❌ NIN service test failed:', error);
      
      let message;
      if (error.message.includes('Request timed out')) {
        message = 'Connection timed out - server may be slow or unreachable';
      } else if (error.message.includes('Network request failed')) {
        message = 'Cannot reach NIN service - check network connection';
      } else {
        message = `Test failed: ${error.message}`;
      }
      
      return {
        success: false,
        message,
        details: {
          endpoint: API_BASE_URL,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
