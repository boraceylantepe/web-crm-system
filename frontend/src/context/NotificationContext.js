import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  
  const { isAuthenticated, token } = useContext(AuthContext);
  
  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/notifications/');
      setNotifications(response.data.results || response.data);
      
      // Calculate unread count
      const unread = (response.data.results || response.data).filter(
        notification => !notification.is_read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);
  
  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      const response = await api.get('/api/notifications/notifications/unread_count/');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, token]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated || !token) return;
    
    try {
      await api.post(`/api/notifications/notifications/${notificationId}/mark_as_read/`);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [isAuthenticated, token]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      await api.post('/api/notifications/notifications/mark_all_as_read/');
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          is_read: true
        }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [isAuthenticated, token]);
  
  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      const response = await api.get('/api/notifications/preferences/my_preferences/');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [isAuthenticated, token]);
  
  // Update notification preferences
  const updatePreferences = useCallback(async (updatedPreferences) => {
    if (!isAuthenticated || !token || !preferences) return;
    
    try {
      const response = await api.put(`/api/notifications/preferences/${preferences.id}/`, {
        ...preferences,
        ...updatedPreferences
      });
      setPreferences(response.data);
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, [isAuthenticated, token, preferences]);
  
  // Initialize notifications and preferences when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchPreferences();
      
      // Set up polling for unread count every 30 seconds
      const intervalId = setInterval(fetchUnreadCount, 30000);
      
      return () => {
        clearInterval(intervalId);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, fetchNotifications, fetchPreferences, fetchUnreadCount]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        fetchPreferences,
        updatePreferences
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 