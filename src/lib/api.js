// API utility function for making HTTP requests
const resolveApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) return String(envBase).trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    const host = (window.location.hostname || '').toLowerCase();
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalhost) {
      return 'https://kapdaco.onrender.com';
    }
  }
  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

export const api = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body,
    token, // Deprecated: token is now in HTTP-only cookie, but kept for backward compatibility
    headers = {},
    ...otherOptions
  } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // Always include cookies (HTTP-only token)
    ...otherOptions,
  };

  // Support Authorization header for backward compatibility (token param is deprecated)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add body if provided (and not GET request)
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('API request failed:', error);
    }
    throw error;
  }
};

// Helper functions for common HTTP methods
export const apiGet = (endpoint, options = {}) => 
  api(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint, body, options = {}) => 
  api(endpoint, { ...options, method: 'POST', body });

export const apiPut = (endpoint, body, options = {}) => 
  api(endpoint, { ...options, method: 'PUT', body });

export const apiPatch = (endpoint, body, options = {}) => 
  api(endpoint, { ...options, method: 'PATCH', body });

export const apiDelete = (endpoint, options = {}) => 
  api(endpoint, { ...options, method: 'DELETE' });

export default api;