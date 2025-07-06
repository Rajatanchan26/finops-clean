// Configuration for different environments
// Updated to use environment variables for production deployment
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    FIREBASE_CONFIG: {
      // Your Firebase config for development
    }
  },
  production: {
    // Updated with the correct Railway backend URL
    API_BASE_URL: 'https://finops-clean-production.up.railway.app',
    FIREBASE_CONFIG: {
      // Your Firebase config for production
    }
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Enhanced debug logging
console.log('=== CONFIG DEBUG INFO ===');
console.log('Environment:', environment);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('All env vars starting with REACT_APP_:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
console.log('Selected config:', config[environment]);
console.log('Final API_BASE_URL:', config[environment].API_BASE_URL);
console.log('========================');

// Export the appropriate config
export default config[environment]; 