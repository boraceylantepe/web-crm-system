import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Role-based route protection component
 * 
 * @param {object} props Component props
 * @param {React.ReactNode} props.children Child components to render if authorized
 * @param {string} props.requiredRole Required role to access this route ('ADMIN', 'MANAGER', or 'USER')
 * @param {string} props.redirectTo Path to redirect to if not authorized
 */
const RoleBasedRoute = ({ children, requiredRole = 'USER', redirectTo = '/' }) => {
  const { isAuthenticated, loading, hasPermission } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // First check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Then check role-based permission
  if (!hasPermission(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleBasedRoute; 