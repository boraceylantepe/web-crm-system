import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { createUser } from '../services/userService';
import { AuthContext } from '../context/AuthContext';

const UserAdd = () => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'USER',
    password: '',
    password_confirm: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAdmin, isAdminOrManager } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Only ADMIN or MANAGER can access this page
    if (!isAdminOrManager) {
      navigate('/');
    }
    
    // Only ADMIN can create ADMIN users
    if (!isAdmin) {
      setFormData(prev => ({ ...prev, role: 'USER' }));
    }
  }, [isAdmin, isAdminOrManager, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate first name
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    
    // Validate last name
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate password confirmation
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }
    
    // Validate role based on user's role
    if (!isAdmin && formData.role === 'ADMIN') {
      newErrors.role = 'Only admins can create admin users';
    }
    
    if (!isAdmin && formData.role === 'MANAGER') {
      newErrors.role = 'Only admins can create manager users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await createUser(formData);
      navigate('/users');
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.response?.data) {
        // Handle backend validation errors
        const backendErrors = err.response.data;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          formattedErrors[key] = Array.isArray(backendErrors[key]) 
            ? backendErrors[key][0] 
            : backendErrors[key];
        });
        
        setErrors(formattedErrors);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">Create New User</Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/users"
          >
            Back to Users
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email Address"
                variant="outlined"
                fullWidth
                required
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  <MenuItem value="USER">User</MenuItem>
                  {/* Only admins can create managers */}
                  {isAdmin && (
                    <MenuItem value="MANAGER">Manager</MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  )}
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="first_name"
                label="First Name"
                variant="outlined"
                fullWidth
                required
                value={formData.first_name}
                onChange={handleChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="last_name"
                label="Last Name"
                variant="outlined"
                fullWidth
                required
                value={formData.last_name}
                onChange={handleChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="password"
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || 'Must be at least 8 characters'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="password_confirm"
                label="Confirm Password"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={formData.password_confirm}
                onChange={handleChange}
                error={!!errors.password_confirm}
                helperText={errors.password_confirm}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UserAdd; 