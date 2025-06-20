import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Layout Components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// Customer Management
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerAdd from './pages/CustomerAdd';
import CustomerEdit from './pages/CustomerEdit';

// Sales Management
import Sales from './pages/Sales';
import SaleDetail from './pages/SaleDetail';
import SaleAdd from './pages/SaleAdd';

// User Management
import Users from './pages/Users';
import UserAdd from './pages/UserAdd';
import UserEdit from './pages/UserEdit';
import Profile from './pages/Profile';

// Task Management
import TasksPage from './pages/TasksPage';
import TaskDetail from './pages/TaskDetail';

// Calendar Management
import Calendar from './pages/Calendar';
import EventDetail from './pages/EventDetail';

// Notification Management
import Notifications from './pages/Notifications';
import NotificationSettings from './pages/NotificationSettings';

// Reporting & Analytics
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                
                {/* Profile Route - accessible to all authenticated users */}
                <Route path="profile" element={<Profile />} />
                
                {/* Customer Routes */}
                <Route path="customers" element={<Customers />} />
                <Route path="customers/add" element={<CustomerAdd />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="customers/edit/:id" element={<CustomerEdit />} />
                
                {/* Sales Routes */}
                <Route path="sales" element={<Sales />} />
                <Route path="sales/add" element={<SaleAdd />} />
                <Route path="sales/:id" element={<SaleDetail />} />
                
                {/* User Management Routes - Admin/Manager only */}
                <Route path="users" element={
                  <RoleBasedRoute requiredRole="MANAGER">
                    <Users />
                  </RoleBasedRoute>
                } />
                <Route path="users/add" element={
                  <RoleBasedRoute requiredRole="MANAGER">
                    <UserAdd />
                  </RoleBasedRoute>
                } />
                <Route path="users/edit/:id" element={
                  <RoleBasedRoute requiredRole="MANAGER">
                    <UserEdit />
                  </RoleBasedRoute>
                } />
                
                {/* Task Routes */}
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/:id" element={<TaskDetail />} />
                
                {/* Calendar Routes */}
                <Route path="calendar" element={<Calendar />} />
                <Route path="calendar/:id" element={<EventDetail />} />
                
                {/* Notification Routes */}
                <Route path="notifications" element={<Notifications />} />
                <Route path="notifications/settings" element={<NotificationSettings />} />
                
                {/* Reporting & Analytics Routes */}
                <Route path="analytics" element={<Analytics />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
