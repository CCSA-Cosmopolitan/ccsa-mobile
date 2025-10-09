// API Configuration
const API_CONFIG = {
  // Replace this with your actual backend API URL
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.20.10.4:3000', // Use environment variable or fallback
  
  // API endpoints
  ENDPOINTS: {
    STATES: '/api/locations/states',
    LOCAL_GOVERNMENTS: '/api/locations/local-governments',
    WARDS: '/api/locations/wards',
    POLLING_UNITS: '/api/locations/polling-units',
    
    // Other API endpoints
    FARMERS: '/api/farmers',
    FARMS: '/api/farms',
    AGENTS: '/api/agents',
    AUTH: '/api/auth',
    ANALYTICS: '/api/analytics',
    HEALTH: '/api/health',
    
    // NIN and SMS endpoints
    NIN_LOOKUP: '/api/nin/lookup',
    TEMP_NIN_LOOKUP: '/api/temp-nin/lookup',
    SMS_SEND: '/api/sms/send-verification',
    SMS_VERIFY: '/api/sms/verify-code'
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Retry configuration
  RETRY: {
    attempts: 3,
    delay: 1000
  }
};

export default API_CONFIG;
