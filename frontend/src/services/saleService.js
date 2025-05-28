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

export const getSales = async (params = {}) => {
  try {
    console.log('Making API request to get sales with params:', params);
    
    // Convert parameters to query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    // Log the constructed URL for debugging
    const url = `${API_URL}/api/sales/?${queryParams.toString()}`;
    console.log('Request URL:', url);
    
    const response = await axios.get(url, getAuthHeaders());
    console.log('Sales response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};

export const getSaleById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/sales/${id}/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching sale ${id}:`, error);
    throw error;
  }
};

export const getSalesPipeline = async (params = {}) => {
  try {
    console.log('Making API request to get sales pipeline');
    const response = await axios.get(`${API_URL}/api/sales/pipeline/`, {
      ...getAuthHeaders(),
      params
    });
    
    console.log('Raw pipeline response:', response.data);
    
    // Ensure each status has an array
    const pipelineData = response.data || {};
    const statuses = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    
    // Initialize each status with an empty array if not present
    const normalizedData = {};
    
    // Debug the structure of the response data
    console.log('Pipeline data object keys:', Object.keys(pipelineData));
    
    statuses.forEach(status => {
      // Check if we have data for this status
      if (pipelineData[status]) {
        // Debug each status
        console.log(`Status ${status} data:`, pipelineData[status]);
        console.log(`Status ${status} is array:`, Array.isArray(pipelineData[status]));
        console.log(`Status ${status} length:`, pipelineData[status].length);
        
        if (Array.isArray(pipelineData[status])) {
          normalizedData[status] = pipelineData[status];
        } else {
          console.warn(`Status ${status} data is not an array, using empty array`);
          normalizedData[status] = [];
        }
      } else {
        console.warn(`No data found for status ${status}, using empty array`);
        normalizedData[status] = [];
      }
    });
    
    console.log('Normalized pipeline data:', normalizedData);
    return normalizedData;
  } catch (error) {
    console.error('Error fetching sales pipeline:', error);
    
    if (error.response) {
      console.error('API Error response:', error.response.data);
      console.error('API Error status:', error.response.status);
    }
    
    // Return empty arrays for each status as fallback
    const fallbackData = {
      NEW: [],
      CONTACTED: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: []
    };
    
    console.log('Using fallback pipeline data:', fallbackData);
    return fallbackData;
  }
};

export const getSalesStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/sales/stats/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    throw error;
  }
};

export const createSale = async (saleData) => {
  try {
    // Validate required fields on the frontend side
    if (!saleData.title) {
      throw new Error('Title is required');
    }
    if (!saleData.customer) {
      throw new Error('Customer is required');
    }
    
    const response = await axios.post(
      `${API_URL}/api/sales/`, 
      saleData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    
    // Get detailed error message from the API if available
    if (error.response && error.response.data) {
      // If the response has specific field errors
      if (typeof error.response.data === 'object') {
        const fieldErrors = Object.values(error.response.data)
          .flat()
          .filter(Boolean)
          .join(', ');
          
        if (fieldErrors) {
          throw new Error(fieldErrors);
        }
      }
      
      // If the response has a general error message
      if (error.response.data.error) {
        throw new Error(error.response.data.error);
      }
    }
    
    // Fall back to a generic error message
    throw new Error('Failed to create sale opportunity. Please try again.');
  }
};

export const updateSale = async (id, saleData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/sales/${id}/`, 
      saleData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating sale ${id}:`, error);
    throw error;
  }
};

export const deleteSale = async (id) => {
  try {
    await axios.delete(`${API_URL}/api/sales/${id}/`, getAuthHeaders());
    return true;
  } catch (error) {
    console.error(`Error deleting sale ${id}:`, error);
    throw error;
  }
};

export const updateSaleStatus = async (id, status) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/sales/${id}/update_status/`, 
      { status }, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating sale status ${id}:`, error);
    throw error;
  }
};

export const getSaleNotes = async (saleId) => {
  try {
    const response = await axios.get(`${API_URL}/api/sales/${saleId}/notes/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching notes for sale ${saleId}:`, error);
    return [];
  }
};

export const createSaleNote = async (noteData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/sales/${noteData.sale}/notes/create/`, 
      noteData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating sale note:', error);
    throw error;
  }
}; 