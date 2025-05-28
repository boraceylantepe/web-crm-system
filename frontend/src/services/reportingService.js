import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/reporting';

// Create axios instance with interceptors for authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// Analytics API calls
export const analyticsAPI = {
  // Get dashboard KPIs
  getDashboardKPIs: () => apiClient.get('/analytics/dashboard_kpis/'),
  
  // Get sales performance data
  getSalesPerformance: (params = {}) => 
    apiClient.get('/analytics/sales_performance/', { params }),
  
  // Get customer engagement data
  getCustomerEngagement: (params = {}) => 
    apiClient.get('/analytics/customer_engagement/', { params }),
  
  // Get task completion data
  getTaskCompletion: (params = {}) => 
    apiClient.get('/analytics/task_completion/', { params }),
  
  // Get conversion ratios
  getConversionRatios: (params = {}) => 
    apiClient.get('/analytics/conversion_ratios/', { params }),
  
  // Get user activity data (for managers)
  getUserActivity: (params = {}) => 
    apiClient.get('/analytics/user_activity/', { params }),
  
  // Clear analytics cache
  clearCache: () => apiClient.post('/analytics/clear_cache/'),
  
  // Generate custom report
  generateCustomReport: (data) => 
    apiClient.post('/analytics/custom_report/', data),
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
  
  // Run schedule immediately
  runNow: (id) => apiClient.post(`/schedules/${id}/run_now/`),
};

// Report Shares API calls
export const reportSharesAPI = {
  // Get all shares
  getShares: () => apiClient.get('/shares/'),
  
  // Get specific share
  getShare: (id) => apiClient.get(`/shares/${id}/`),
  
  // Access shared report
  accessReport: (id) => apiClient.get(`/shares/${id}/access_report/`),
  
  // Create new share
  createShare: (data) => apiClient.post('/shares/', data),
  
  // Update share
  updateShare: (id, data) => apiClient.put(`/shares/${id}/`, data),
  
  // Delete share
  deleteShare: (id) => apiClient.delete(`/shares/${id}/`),
};

// Real-time updates API
export const realtimeAPI = {
  // Get real-time dashboard updates
  getDashboardUpdates: () => apiClient.get('/realtime/dashboard_updates/'),
  
  // Subscribe to real-time updates (WebSocket would be implemented here)
  subscribeToUpdates: (callback) => {
    // WebSocket implementation would go here
    console.log('WebSocket subscription not yet implemented');
    return {
      disconnect: () => console.log('WebSocket disconnected')
    };
  },
  
  // Get live KPI updates
  getLiveKPIs: () => apiClient.get('/realtime/live_kpis/'),
};

// Advanced filtering API
export const filteringAPI = {
  // Get available filter options
  getFilterOptions: (reportType) => 
    apiClient.get(`/filters/options/${reportType}/`),
  
  // Apply complex filters
  applyFilters: (reportType, filters) => 
    apiClient.post(`/filters/apply/${reportType}/`, { filters }),
  
  // Save filter preset
  saveFilterPreset: (data) => apiClient.post('/filters/presets/', data),
  
  // Get saved filter presets
  getFilterPresets: () => apiClient.get('/filters/presets/'),
  
  // Delete filter preset
  deleteFilterPreset: (id) => apiClient.delete(`/filters/presets/${id}/`),
};

// Performance optimization API
export const performanceAPI = {
  // Get performance metrics
  getPerformanceMetrics: () => apiClient.get('/performance/metrics/'),
  
  // Optimize query performance
  optimizeQuery: (queryData) => 
    apiClient.post('/performance/optimize_query/', queryData),
  
  // Get cache statistics
  getCacheStats: () => apiClient.get('/performance/cache_stats/'),
  
  // Preload data for better performance
  preloadData: (dataType, params) => 
    apiClient.post('/performance/preload/', { dataType, params }),
};

// Utility functions
export const exportUtils = {
  // Download CSV file
  downloadCSV: async (reportId, filename = 'report.csv') => {
    try {
      const response = await generatedReportsAPI.exportCSV(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw error;
    }
  },
  
  // Download PDF file
  downloadPDF: async (reportId, filename = 'report.pdf') => {
    try {
      const response = await generatedReportsAPI.exportPDF(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },
  
  // Export dashboard as image
  exportDashboardImage: async (elementId, filename = 'dashboard.png') => {
    try {
      const html2canvas = await import('html2canvas');
      const element = document.getElementById(elementId);
      const canvas = await html2canvas.default(element);
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting dashboard image:', error);
      throw error;
    }
  },
  
  // Format date for API calls
  formatDateForAPI: (date) => {
    return date ? date.toISOString() : null;
  },
  
  // Parse date range for filters
  parseDateRange: (startDate, endDate) => ({
    start: exportUtils.formatDateForAPI(startDate),
    end: exportUtils.formatDateForAPI(endDate)
  }),
  
  // Format numbers for display
  formatNumber: (num, precision = 2) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision
    });
  },
  
  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  },
  
  // Format percentage
  formatPercentage: (value, precision = 1) => {
    return `${(value || 0).toFixed(precision)}%`;
  },
  
  // Debounce function for search/filter inputs
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Notification utilities
export const notificationUtils = {
  // Show success notification
  showSuccess: (message) => {
    // This would integrate with a notification library
    console.log('Success:', message);
  },
  
  // Show error notification
  showError: (message) => {
    console.error('Error:', message);
  },
  
  // Show info notification
  showInfo: (message) => {
    console.log('Info:', message);
  },
  
  // Show warning notification
  showWarning: (message) => {
    console.warn('Warning:', message);
  },
};

export default {
  analytics: analyticsAPI,
  templates: reportTemplatesAPI,
  reports: generatedReportsAPI,
  widgets: dashboardWidgetsAPI,
  dashboard: userDashboardAPI,
  schedules: reportSchedulesAPI,
  shares: reportSharesAPI,
  realtime: realtimeAPI,
  filtering: filteringAPI,
  performance: performanceAPI,
  utils: exportUtils,
  notifications: notificationUtils,
}; 