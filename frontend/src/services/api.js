import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For debugging token issues
export const checkTokenValidity = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('No access token found in localStorage');
    return false;
  }
  
  try {
    // Split the token and check parts
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format (not a valid JWT)');
      return false;
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(tokenParts[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    console.log('Token expiry:', new Date(expiry).toLocaleString());
    console.log('Current time:', new Date(now).toLocaleString());
    console.log('Token valid for:', Math.round((expiry - now) / 1000 / 60), 'minutes');
    
    if (expiry < now) {
      console.warn('Token has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check token validity before making request (for debugging)
      if (!config.url.includes('/token/')) {
        checkTokenValidity();
      }
    } else {
      console.warn(`No auth token available for request to ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Received 401 error, attempting token refresh...');
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('No refresh token available');
          // No refresh token available, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_id');
          
          // Store the current URL to redirect back after login
          localStorage.setItem('redirect_after_login', window.location.pathname);
          
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('Attempting to refresh token...');
        
        // Try to get a new token using a direct axios call (not our api instance)
        const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        console.log('Token refreshed successfully');

        // Save the new token
        localStorage.setItem('access_token', access);

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // If refresh token is expired or invalid, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        
        // Store the current URL to redirect back after login
        localStorage.setItem('redirect_after_login', window.location.pathname);
        
        // Display an error message to the user
        alert('Your session has expired. Please log in again.');
        
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 