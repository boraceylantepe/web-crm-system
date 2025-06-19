import axios from 'axios';
import { API_URL } from '../utils/constants';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const getUsers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/`, {
      ...getAuthHeaders(),
      params
    });
    
    // Check the response format and ensure we return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Handle case where the response is paginated or has a different structure
      if (Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.warn('Unexpected API response format from users endpoint:', response.data);
        return [];
      }
    } else {
      console.error('Invalid response format from users endpoint:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${id}/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/users/me/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/users/`, 
      userData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/${id}/`, 
      userData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const managerUpdateUser = async (id, userData) => {
  // This function uses the special endpoint for managers to update users
  try {
    console.log(`Using manager update endpoint for user ${id}`);
    const response = await axios.put(
      `${API_URL}/api/users/${id}/manager-update/`, 
      userData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error with manager update for user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await axios.delete(`${API_URL}/api/users/${id}/`, getAuthHeaders());
    return true;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/users/change_password/`, 
      passwordData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Get current user profile
export const getProfile = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/users/profile/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Update current user profile (supports file uploads)
export const updateProfile = async (formData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await axios.patch(
      `${API_URL}/api/users/profile/`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let axios set it automatically for FormData
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Update current user profile with JSON data (for non-file updates)
export const updateProfileData = async (userData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/users/profile/`,
      userData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating profile data:', error);
    throw error;
  }
};

const userService = {
  getUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  managerUpdateUser,
  deleteUser,
  changePassword,
  getProfile,
  updateProfile,
  updateProfileData
};

export default userService; 