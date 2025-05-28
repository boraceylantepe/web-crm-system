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

export const getCustomers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/customers/`, {
      ...getAuthHeaders(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/customers/${id}/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/customers/`, 
      customerData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/customers/${id}/`, 
      customerData, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    await axios.delete(`${API_URL}/api/customers/${id}/`, getAuthHeaders());
    return true;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
};

// Search customers with advanced filters
export const searchCustomers = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/customers/search_advanced/`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
}; 