import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/reporting';

// Create axios instance with interceptors for authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced Analytics API calls with better error handling
export const analyticsAPI = {
  // Get dashboard KPIs with enhanced error handling and cache-busting
  getDashboardKPIs: async (params = {}) => {
    try {
      // Add cache-busting parameter and any other params
      const requestParams = {
        ...params,
        _t: new Date().getTime() // Cache-busting timestamp
      };
      
      const response = await apiClient.get('/analytics/dashboard_kpis/', { params: requestParams });
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error);
      return {
        data: {
          sales: { total_amount: 0, total_sales: 0, won_sales: 0, win_rate: 0 },
          customers: { total_customers: 0, new_this_month: 0 },
          tasks: { completed_tasks: 0, completion_rate: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load dashboard data'
      };
    }
  },
  
  // Get sales performance data with fallback
  getSalesPerformance: async (params = {}) => {
    try {
      // Ensure cache-busting parameter exists
      const requestParams = {
        ...params,
        _t: params._t || new Date().getTime()
      };
      
      const response = await apiClient.get('/analytics/sales_performance/', { params: requestParams });
      return {
        data: {
          sales_over_time: response.data.sales_over_time || [],
          sales_by_status: response.data.sales_by_status || [],
          sales_by_priority: response.data.sales_by_priority || [],
          summary: response.data.summary || {}
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching sales performance:', error);
      return {
        data: {
          sales_over_time: [],
          sales_by_status: [],
          sales_by_priority: [],
          summary: { total_sales: 0, total_amount: 0, won_sales: 0, win_rate: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load sales data'
      };
    }
  },
  
  // Get customer engagement data with fallback
  getCustomerEngagement: async (params = {}) => {
    try {
      // Ensure cache-busting parameter exists
      const requestParams = {
        ...params,
        _t: params._t || new Date().getTime()
      };
      
      const response = await apiClient.get('/analytics/customer_engagement/', { params: requestParams });
      return {
        data: {
          customer_status: response.data.customer_status || [],
          engagement_levels: response.data.engagement_levels || [],
          acquisition_over_time: response.data.acquisition_over_time || [],
          regional_distribution: response.data.regional_distribution || [],
          summary: response.data.summary || {}
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching customer engagement:', error);
      return {
        data: {
          customer_status: [],
          engagement_levels: [],
          acquisition_over_time: [],
          regional_distribution: [],
          summary: { total_customers: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load customer data'
      };
    }
  },
  
  // Get task completion data with fallback
  getTaskCompletion: async (params = {}) => {
    try {
      // Ensure cache-busting parameter exists
      const requestParams = {
        ...params,
        _t: params._t || new Date().getTime()
      };
      
      const response = await apiClient.get('/analytics/task_completion/', { params: requestParams });
      return {
        data: {
          completion_over_time: response.data.completion_over_time || [],
          task_by_priority: response.data.task_by_priority || [],
          task_by_status: response.data.task_by_status || [],
          summary: response.data.summary || {}
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching task completion:', error);
      return {
        data: {
          completion_over_time: [],
          task_by_priority: [],
          task_by_status: [],
          summary: { completed_tasks: 0, total_tasks: 0, completion_rate: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load task data'
      };
    }
  },
  
  // Get conversion ratios
  getConversionRatios: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/conversion_ratios/', { params });
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching conversion ratios:', error);
      return {
        data: {},
        success: false,
        error: error.response?.data?.message || 'Failed to load conversion data'
      };
    }
  },
  
  // Get user activity data (for managers)
  getUserActivity: async (params = {}) => {
    try {
      const response = await apiClient.get('/analytics/user_activity/', { params });
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return {
        data: {},
        success: false,
        error: error.response?.data?.message || 'Failed to load user activity data'
      };
    }
  },
  
  // Get user sales performance data (managers/admins only)
  getUserSalesPerformance: async (params = {}) => {
    try {
      // Ensure cache-busting parameter exists
      const requestParams = {
        ...params,
        _t: params._t || new Date().getTime()
      };
      
      const response = await apiClient.get('/analytics/user_sales_performance/', { params: requestParams });
      return {
        data: {
          users: response.data.users || [],
          summary: response.data.summary || {}
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching user sales performance:', error);
      return {
        data: {
          users: [],
          summary: { total_users: 0, total_revenue: 0, total_deals: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load user sales performance data'
      };
    }
  },
  
  // Get user task performance data (managers/admins only)
  getUserTaskPerformance: async (params = {}) => {
    try {
      // Ensure cache-busting parameter exists
      const requestParams = {
        ...params,
        _t: params._t || new Date().getTime()
      };
      
      const response = await apiClient.get('/analytics/user_task_performance/', { params: requestParams });
      return {
        data: {
          users: response.data.users || [],
          summary: response.data.summary || {}
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching user task performance:', error);
      return {
        data: {
          users: [],
          summary: { total_users: 0, total_tasks: 0, total_completed: 0 }
        },
        success: false,
        error: error.response?.data?.message || 'Failed to load user task performance data'
      };
    }
  },
  
  // Clear analytics cache
  clearCache: async () => {
    try {
      await apiClient.post('/analytics/clear_cache/');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to clear cache'
      };
    }
  },
  
  // Generate custom report
  generateCustomReport: async (data) => {
    try {
      const response = await apiClient.post('/analytics/custom_report/', data);
      return {
        data: response.data,
        success: true
      };
    } catch (error) {
      console.error('Error generating custom report:', error);
      return {
        data: {},
        success: false,
        error: error.response?.data?.message || 'Failed to generate report'
      };
    }
  }
};

// Report Templates API calls
export const reportTemplatesAPI = {
  // Get all templates
  getTemplates: () => apiClient.get('/templates/'),
  
  // Get specific template
  getTemplate: (id) => apiClient.get(`/templates/${id}/`),
  
  // Create new template
  createTemplate: (data) => apiClient.post('/templates/', data),
  
  // Update template
  updateTemplate: (id, data) => apiClient.put(`/templates/${id}/`, data),
  
  // Delete template
  deleteTemplate: (id) => apiClient.delete(`/templates/${id}/`),
  
  // Duplicate template
  duplicateTemplate: (id) => apiClient.post(`/templates/${id}/duplicate/`),
  
  // Generate report from template
  generateReport: (templateId) => 
    apiClient.post(`/templates/${templateId}/generate/`),
};

// Generated Reports API calls
export const generatedReportsAPI = {
  // Get all generated reports
  getReports: () => apiClient.get('/reports/'),
  
  // Get specific report
  getReport: (id) => apiClient.get(`/reports/${id}/`),
  
  // Export report as CSV
  exportCSV: (id) => apiClient.get(`/reports/${id}/export_csv/`, {
    responseType: 'blob'
  }),
  
  // Export report as PDF
  exportPDF: (id) => apiClient.get(`/reports/${id}/export_pdf/`, {
    responseType: 'blob'
  }),
  
  // Share report
  shareReport: (id, data) => apiClient.post(`/reports/${id}/share/`, data),
  
  // Delete report
  deleteReport: (id) => apiClient.delete(`/reports/${id}/delete_report/`),
};

// Dashboard Widgets API calls
export const dashboardWidgetsAPI = {
  // Get all widgets
  getWidgets: () => apiClient.get('/widgets/'),
  
  // Get specific widget
  getWidget: (id) => apiClient.get(`/widgets/${id}/`),
  
  // Create new widget
  createWidget: (data) => apiClient.post('/widgets/', data),
  
  // Update widget
  updateWidget: (id, data) => apiClient.put(`/widgets/${id}/`, data),
  
  // Delete widget
  deleteWidget: (id) => apiClient.delete(`/widgets/${id}/`),
  
  // Get widget data
  getWidgetData: (id) => apiClient.get(`/widgets/${id}/data/`),
};

// User Dashboard API calls
export const userDashboardAPI = {
  // Get user dashboards
  getDashboards: () => apiClient.get('/dashboards/'),
  
  // Get specific dashboard
  getDashboard: (id) => apiClient.get(`/dashboards/${id}/`),
  
  // Create new dashboard
  createDashboard: (data) => apiClient.post('/dashboards/', data),
  
  // Update dashboard
  updateDashboard: (id, data) => apiClient.put(`/dashboards/${id}/`, data),
  
  // Add widget to dashboard
  addWidget: (dashboardId, data) => 
    apiClient.post(`/dashboards/${dashboardId}/add_widget/`, data),
  
  // Remove widget from dashboard
  removeWidget: (dashboardId, data) => 
    apiClient.delete(`/dashboards/${dashboardId}/remove_widget/`, { data }),
  
  // Update dashboard layout
  updateLayout: (dashboardId, data) => 
    apiClient.post(`/dashboards/${dashboardId}/update_layout/`, data),
  
  // Save dashboard configuration
  saveDashboard: (widgets) => {
    // This would save the widget configuration to the backend
    console.log('Saving dashboard with widgets:', widgets);
    return Promise.resolve({ data: { success: true } });
  }
};

// Report Schedules API calls
export const reportSchedulesAPI = {
  // Get all schedules
  getSchedules: () => apiClient.get('/schedules/'),
  
  // Get specific schedule
  getSchedule: (id) => apiClient.get(`/schedules/${id}/`),
  
  // Create new schedule
  createSchedule: (data) => apiClient.post('/schedules/', data),
  
  // Update schedule
  updateSchedule: (id, data) => apiClient.put(`/schedules/${id}/`, data),
  
  // Delete schedule
  deleteSchedule: (id) => apiClient.delete(`/schedules/${id}/`),
  
  // Toggle schedule active status
  toggleSchedule: (id) => apiClient.post(`/schedules/${id}/toggle_active/`),
  
  // Run schedule now
  runNow: (id) => apiClient.post(`/schedules/${id}/run_now/`),
};

// Utility functions
export const utilsAPI = {
  // Download CSV function that triggers file download
  downloadCSV: async (reportId, filename) => {
    try {
      const response = await apiClient.get(`/reports/${reportId}/export_csv/`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error(error.response?.data?.message || 'Failed to download CSV');
    }
  },
  
  // Download PDF function (for future implementation)
  downloadPDF: async (reportId, filename) => {
    try {
      const response = await apiClient.get(`/reports/${reportId}/export_pdf/`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error(error.response?.data?.message || 'Failed to download PDF');
    }
  }
};

// Utility function for debouncing API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Main reporting service object
const reportingService = {
  analytics: analyticsAPI,
  templates: reportTemplatesAPI,
  reports: generatedReportsAPI,
  widgets: dashboardWidgetsAPI,
  dashboards: userDashboardAPI,
  schedules: reportSchedulesAPI,
  utils: utilsAPI,
  debounce
};

export default reportingService; 