import axios from 'axios';
import api from './api';
import { API_URL } from '../utils/constants';
import { checkTokenValidity } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Fetch all calendar events (filtered by user unless admin)
export const getCalendarEvents = async (params = {}) => {
  try {
    console.log('Fetching calendar events...');
    console.log('API URL:', `${API_URL}/api/calendar/events/`);
    
    // Check token validity before making the request
    const isTokenValid = checkTokenValidity();
    console.log('Token valid before fetch:', isTokenValid);
    
    // Use the api instance which handles token refresh
    const response = await api.get('/api/calendar/events/', { params });
    
    console.log('Calendar API response status:', response.status);
    console.log('Calendar API response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    console.log('Calendar API response data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
    
    // Validate response data for better debugging
    const data = response.data;
    if (Array.isArray(data)) {
      data.forEach((event, index) => {
        if (!event.start_time || !event.end_time) {
          console.warn(`Event at index ${index} has invalid date format:`, event);
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    
    // Log detailed error information
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);
      console.error('API Error Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

// Fetch a single event by ID
export const getEventById = async (id) => {
  try {
    const response = await api.get(`/api/calendar/events/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    throw error;
  }
};

// Create a new calendar event
export const createEvent = async (eventData) => {
  try {
    console.log('Creating calendar event with data:', eventData);
    
    // Ensure the owner field is present
    if (!eventData.owner) {
      console.warn('Owner field missing in event data');
      // Try to get current user ID as fallback
      const userId = localStorage.getItem('user_id');
      if (userId) {
        console.log('Using current user ID as owner:', userId);
        eventData.owner = userId;
      } else {
        console.error('Cannot create event: no owner specified and no current user ID found');
        throw new Error('Owner field is required for calendar events');
      }
    }
    
    // Check token validity before making the request
    const isTokenValid = checkTokenValidity();
    console.log('Token valid before create:', isTokenValid);
    
    // Use the api instance which handles token refresh
    const response = await api.post('/api/calendar/events/', eventData);
    console.log('Event created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', error.response.data);
      console.error('Attempted with event data:', eventData);
      
      // Specific handling for auth errors
      if (error.response.status === 401) {
        console.error('Authentication error - token may be invalid');
      }
    }
    
    throw error;
  }
};

// Update an existing calendar event
export const updateEvent = async (id, eventData) => {
  try {
    console.log(`Updating event ${id} with data:`, eventData);
    
    // Ensure required fields are present
    if (!eventData.title || !eventData.owner) {
      console.warn('Missing required fields in update data');
      console.warn('Attempting to fetch full event data before update');
      
      try {
        // Get the current event data
        const currentEvent = await getEventById(id);
        console.log('Retrieved current event data:', currentEvent);
        
        // Fill in any missing required fields
        if (!eventData.title && currentEvent.title) {
          eventData.title = currentEvent.title;
        }
        
        if (!eventData.owner && currentEvent.owner) {
          eventData.owner = currentEvent.owner;
        }
        
        if (!eventData.event_type && currentEvent.event_type) {
          eventData.event_type = currentEvent.event_type;
        }
      } catch (fetchError) {
        console.error('Failed to fetch current event data:', fetchError);
        // Continue with the update attempt anyway
      }
    }
    
    // Double check required fields
    if (!eventData.title || !eventData.owner) {
      console.error('Still missing required fields after fetch attempt');
      throw new Error('Missing required fields: title and owner are required');
    }
    
    // Use PATCH method for partial updates instead of PUT
    const response = await api.patch(`/api/calendar/events/${id}/`, eventData);
    console.log('Event updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', error.response.data);
      console.error('Attempted with event data:', eventData);
    }
    
    throw error;
  }
};

// Delete a calendar event
export const deleteEvent = async (id) => {
  try {
    await api.delete(`/api/calendar/events/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
};

// Get available users for event participants
export const getAvailableUsers = async () => {
  try {
    const response = await api.get(`/api/users/for_calendar/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available users:', error);
    throw error;
  }
};

// Get upcoming events for dashboard
export const getUpcomingEvents = async (limit = 3) => {
  try {
    // Get current date in ISO format
    const today = new Date().toISOString();
    
    // Get events starting from today, sorted by start_time
    const response = await api.get('/api/calendar/events/', { 
      params: { 
        from_date: today,
        limit: limit,
        ordering: 'start_time'
      } 
    });
    
    // Handle both array response and paginated response
    if (Array.isArray(response.data)) {
      return response.data.slice(0, limit);
    } else if (response.data && response.data.results) {
      return response.data.results.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

const calendarService = {
  getCalendarEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAvailableUsers,
  getUpcomingEvents
};

export default calendarService; 