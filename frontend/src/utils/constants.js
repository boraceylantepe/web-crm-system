// API URL settings
export const API_URL = 'http://localhost:8000';

// Authentication constants
export const TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const USER_STORAGE_KEY = 'user';

// Date formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

// Status constants
export const SALE_STATUSES = {
  NEW: { label: 'New', color: 'primary' },
  CONTACTED: { label: 'Contacted', color: 'info' },
  PROPOSAL: { label: 'Proposal Sent', color: 'warning' },
  NEGOTIATION: { label: 'Negotiation', color: 'secondary' },
  WON: { label: 'Won', color: 'success' },
  LOST: { label: 'Lost', color: 'danger' }
}; 