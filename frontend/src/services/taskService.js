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

// Fetch all tasks (for managers) or assigned tasks (for users)
export const getTasks = async () => {
  const response = await axios.get(`${API_URL}/api/task-management/tasks/`, getAuthHeaders());
  return response.data;
};

// Fetch a single task by ID
export const getTaskById = async (id) => {
  const response = await axios.get(`${API_URL}/api/task-management/tasks/${id}/`, getAuthHeaders());
  return response.data;
};

// Get task statistics
export const getTaskStats = async () => {
  const response = await axios.get(`${API_URL}/api/task-management/stats/`, getAuthHeaders());
  return response.data;
};

// Create a new task
export const createTask = async (taskData) => {
  console.log('Creating task with data:', taskData);
  try {
    const response = await axios.post(`${API_URL}/api/task-management/tasks/`, taskData, getAuthHeaders());
    console.log('Task created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error.response?.data || error.message);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (id, taskData) => {
  const response = await axios.put(`${API_URL}/api/task-management/tasks/${id}/`, taskData, getAuthHeaders());
  return response.data;
};

// Update only the task status (for non-manager users)
export const updateTaskStatus = async (id, status) => {
  const response = await axios.patch(`${API_URL}/api/task-management/tasks/${id}/`, { status }, getAuthHeaders());
  return response.data;
};

// Delete a task
export const deleteTask = async (id) => {
  await axios.delete(`${API_URL}/api/task-management/tasks/${id}/`, getAuthHeaders());
};

// Fetch users for task assignment (managers only)
export const getUsersForTaskAssignment = async () => {
  const response = await axios.get(`${API_URL}/api/task-management/users/`, getAuthHeaders());
  return response.data;
};

// Task comments
export const getTaskComments = async (taskId) => {
  try {
    console.log(`taskService.getTaskComments called for taskId: ${taskId}`);
    const headers = getAuthHeaders();
    console.log('Request headers:', headers);
    
    const response = await axios.get(`${API_URL}/api/task-management/tasks/${taskId}/comments/`, {
      ...headers,
      // Add cache-busting parameter to ensure fresh data
      params: { _t: Date.now() }
    });
    
    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    
    // Handle paginated response - extract comments from results array
    let comments = [];
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      // Paginated response format
      comments = response.data.results;
      console.log(`Found paginated response with ${comments.length} comments`);
    } else if (Array.isArray(response.data)) {
      // Direct array response format
      comments = response.data;
      console.log(`Found direct array response with ${comments.length} comments`);
    } else {
      console.log('Unexpected response format, defaulting to empty array');
      comments = [];
    }
    
    console.log(`taskService returning ${comments.length} comments:`, comments);
    return comments;
  } catch (error) {
    console.error('Error fetching task comments:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error; // Re-throw to let component handle it
  }
};

export const addTaskComment = async (taskId, comment) => {
  try {
    // The backend expects the comment field
    const response = await axios.post(
      `${API_URL}/api/task-management/tasks/${taskId}/comments/`,
      { comment },
      getAuthHeaders()
    );
    // Log the response for debugging
    console.log('Comment added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding task comment:', error.response?.data || error.message);
    throw error; // Re-throw to allow the component to handle it
  }
};

export const updateTaskComment = async (commentId, comment) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/task-management/comments/${commentId}/`,
      { comment },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating task comment:', error);
    throw error;
  }
};

export const deleteTaskComment = async (commentId) => {
  try {
    await axios.delete(`${API_URL}/api/task-management/comments/${commentId}/`, getAuthHeaders());
    return true;
  } catch (error) {
    console.error('Error deleting task comment:', error);
    throw error;
  }
};

// Get upcoming tasks for dashboard
export const getUpcomingTasks = async (limit = 3) => {
  try {
    // We want pending or in-progress tasks that are not overdue, ordered by due date
    const response = await axios.get(`${API_URL}/api/task-management/tasks/`, {
      ...getAuthHeaders(),
      params: {
        status__in: 'P,IP', // Pending or In Progress
        ordering: 'due_date',
        limit: limit
      }
    });
    
    // Return either the paginated results or the direct array
    if (response.data && response.data.results) {
      return response.data.results.slice(0, limit);
    } else if (Array.isArray(response.data)) {
      return response.data.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    return [];
  }
};

const taskService = {
  getTasks,
  getTaskById,
  getTaskStats,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getUsersForTaskAssignment,
  getTaskComments,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getUpcomingTasks
};

export default taskService; 