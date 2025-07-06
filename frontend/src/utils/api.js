import config from '../config';

// Get the API base URL from config
export const getApiBaseUrl = () => {
  const url = config.API_BASE_URL;
  console.log('=== API UTILITY DEBUG ===');
  console.log('getApiBaseUrl() called');
  console.log('config object:', config);
  console.log('config.API_BASE_URL:', config.API_BASE_URL);
  console.log('Returning URL:', url);
  console.log('========================');
  return url;
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Firebase-Database sync functions
export const syncUserWithDatabase = async (firebaseToken, userData = {}) => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/sync-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firebaseToken, userData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync user');
  }

  return response.json();
};

export const syncAllUsers = async () => {
  const baseUrl = getApiBaseUrl();
  const headers = getAuthHeaders();
  
  const response = await fetch(`${baseUrl}/sync-all-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync all users');
  }

  return response.json();
}; 