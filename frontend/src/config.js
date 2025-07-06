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
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://finops-clean-production.up.railway.app',
    FIREBASE_CONFIG: {
      // Your Firebase config for production
    }
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate config
export default config[environment]; 