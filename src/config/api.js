import Constants from 'expo-constants';

// API Configuration
const API_CONFIG = {
  // Read from expo-constants (works in both dev and production builds)
  // Falls back to app.config.js extra.apiBaseUrl, then to production URL
  BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl || 
            process.env.EXPO_PUBLIC_API_BASE_URL || 
            'https://fims.cosmopolitan.edu.ng',
  
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
    CLUSTERS: '/api/clusters',
    
    // Mobile authentication bridge
    MOBILE_AUTH_ME: '/api/mobile/auth/me',

    // Data correction module
    CORRECTION_FARMERS: '/api/mobile/correction/farmers',

    // Survey module
    MOBILE_SURVEYS: '/api/mobile/surveys',
    MOBILE_SURVEY_DETAIL: '/api/mobile/surveys/:id',
    MOBILE_SURVEY_FARMERS: '/api/mobile/surveys/farmers',
    MOBILE_SURVEY_RESPONSES: '/api/mobile/surveys/:id/responses',

    // Agent application (public — no auth required)
    AGENT_APPLY: '/api/agents/apply',

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
