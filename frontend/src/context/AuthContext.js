import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token') || null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(15); // Default 15 min

  // Define functions with useCallback before they're used in useEffect
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('last_activity');
    localStorage.removeItem('user_id'); // Also remove user_id on logout
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setPasswordChangeRequired(false);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await api.post('/api/token/refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      setToken(access);

      return true;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      logout();
      return false;
    }
  }, [refreshToken, logout]);

  const getUserInfo = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me/');
      setUser(response.data);
      
      // Store user ID in localStorage for easy access in other components
      if (response.data.id) {
        localStorage.setItem('user_id', response.data.id.toString());
      }
      
      // Update session timeout from user settings
      if (response.data.session_timeout) {
        setSessionTimeout(response.data.session_timeout);
      }

      // Check if password change is required
      if (response.data.force_password_change) {
        setPasswordChangeRequired(true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Get user info error:', error.response?.data || error.message);
      
      // Fallback to localStorage if API call fails - for demo mode
      const storedUserInfo = localStorage.getItem('user_info');
      if (storedUserInfo) {
        try {
          const userInfo = JSON.parse(storedUserInfo);
          setUser(userInfo);
          // Also store the user ID separately for easy access
          if (userInfo.id) {
            localStorage.setItem('user_id', userInfo.id.toString());
          }
          return userInfo;
        } catch (e) {
          console.error('Error parsing stored user info', e);
        }
      }
      
      return null;
    }
  }, []);

  // Session activity tracker
  useEffect(() => {
    const updateLastActivity = () => {
      localStorage.setItem('last_activity', Date.now().toString());
    };

    // Set initial last activity
    updateLastActivity();

    // Add event listeners to track user activity
    window.addEventListener('mousemove', updateLastActivity);
    window.addEventListener('keypress', updateLastActivity);
    window.addEventListener('click', updateLastActivity);
    window.addEventListener('scroll', updateLastActivity);

    // Session timeout checker
    const timeoutInterval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('last_activity') || Date.now());
      const currentTime = Date.now();
      const inactiveTime = (currentTime - lastActivity) / 1000 / 60; // in minutes

      if (inactiveTime > sessionTimeout) {
        // User has been inactive for too long, log them out
        logout();
      }
    }, 60000); // Check every minute

    return () => {
      // Clean up event listeners and interval
      window.removeEventListener('mousemove', updateLastActivity);
      window.removeEventListener('keypress', updateLastActivity);
      window.removeEventListener('click', updateLastActivity);
      window.removeEventListener('scroll', updateLastActivity);
      clearInterval(timeoutInterval);
    };
  }, [sessionTimeout, logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (token) {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            // Token expired, try to refresh
            if (refreshToken) {
              await refreshAccessToken();
            } else {
              logout();
            }
          } else {
            // Token valid, get user info
            await getUserInfo();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, refreshToken, refreshAccessToken, logout, getUserInfo]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/token/', credentials);
      const { access, refresh, force_password_change, password_expired } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setToken(access);
      setRefreshToken(refresh);

      // Handle password change requirement
      if (force_password_change || password_expired) {
        setPasswordChangeRequired(true);
      }

      await getUserInfo();
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/api/users/change_password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      // If successful, update state
      setPasswordChangeRequired(false);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Password change error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  };

  // Role-based utility functions
  const isAdmin = user?.role === 'ADMIN';
  
  const isManager = user?.role === 'MANAGER';
  
  const isRegularUser = user?.role === 'USER';
  
  const isAdminOrManager = user && ['ADMIN', 'MANAGER'].includes(user.role);
  
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    if (requiredRole === 'ADMIN') return user.role === 'ADMIN';
    if (requiredRole === 'MANAGER') return ['ADMIN', 'MANAGER'].includes(user.role);
    if (requiredRole === 'USER') return true; // All authenticated users have USER permissions
    
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshAccessToken,
        isAuthenticated: !!token,
        passwordChangeRequired,
        changePassword,
        sessionTimeout,
        // Role-based properties
        isAdmin,
        isManager,
        isRegularUser,
        isAdminOrManager,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 