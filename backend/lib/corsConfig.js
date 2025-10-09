// Secure CORS configuration
export const corsConfig = {
  // Production domains that are allowed to access the API
  allowedOrigins: [
    'http://172.20.10.4:3000',
    'https://ccsa-admin.vercel.app',
    'http://172.20.10.4:3000',
    // Add your production domains here
  ],
  
  // Development origins (only in development)
  developmentOrigins: [
    'http://http://172.20.10.4:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.100:3000',
    'http://192.168.10.219:3000',
    'http://192.168.10.220:3000',
    // Add your development IPs here
  ],
  
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// CORS middleware function
export const setCorsHeaders = (req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const origin = req.headers.origin;
  
  let allowedOrigins = [...corsConfig.allowedOrigins];
  
  // Add development origins only in development mode
  if (isDevelopment) {
    allowedOrigins = [...allowedOrigins, ...corsConfig.developmentOrigins];
  }
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || (isDevelopment && !origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials.toString());
  res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indicates that the request was handled
  }
  
  return false; // Continue with normal request processing
};

export default corsConfig;
