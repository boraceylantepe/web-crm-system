import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import userService from '../services/userService';
import { AuthContext } from '../context/AuthContext';

const UserEdit = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    is_active: true,
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAdmin, isManager, isAdminOrManager } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on permissions
    if (!isAdminOrManager) {
      // Regular users can't access user management
      navigate('/');
      return;
    }
    
    // Load user data
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserById(id);
        setFormData({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          is_active: userData.is_active,
        });
        setOriginalData(userData);
        
        // Redirect if manager tries to edit an admin or another manager
        if (!isAdmin && (userData.role === 'ADMIN' || userData.role === 'MANAGER')) {
          navigate('/users');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id, isAdmin, isAdminOrManager, navigate]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'is_active' ? checked : value;
    setFormData({ ...formData, [name]: newValue });
    
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
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Prevent managers from promoting users to manager/admin roles
    if (!isAdmin) {
      if (formData.role === 'ADMIN') {
        newErrors.role = 'Only admins can create or edit admin users';
      }
      if (formData.role === 'MANAGER' && originalData?.role !== 'MANAGER') {
        newErrors.role = 'Only admins can promote users to manager';
      }
    }
    
    // Don't allow non-admin to deactivate admin users
    if (!isAdmin && originalData?.role === 'ADMIN' && !formData.is_active) {
      newErrors.is_active = 'You cannot deactivate admin users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      if (isAdmin) {
        // Admins use the regular update endpoint
        await userService.updateUser(id, formData);
      } else if (isManager) {
        // Managers use the special manager update endpoint
        console.log('Using manager update endpoint');
        await userService.managerUpdateUser(id, formData);
      }
      navigate('/users');
    } catch (err) {
      console.error('Error updating user:', err);
      if (err.response?.data) {
        // Handle backend validation errors
        const backendErrors = err.response.data;
        const formattedErrors = {};
        
        if (typeof backendErrors === 'object') {
          Object.keys(backendErrors).forEach(key => {
            formattedErrors[key] = Array.isArray(backendErrors[key]) 
              ? backendErrors[key][0] 
              : backendErrors[key];
          });
          setErrors(formattedErrors);
        } else {
          // Handle string error messages
          setError(typeof backendErrors === 'string' ? backendErrors : 
            err.response?.statusText || 'Failed to update user');
        }
      } else {
        setError('Failed to update user. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h1">Edit User</Typography>
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
                  {(isAdmin || originalData?.role === 'MANAGER') && (
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
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleChange}
                    name="is_active"
                    color="primary"
                    disabled={!isAdmin && originalData?.role === 'ADMIN'}
                  />
                }
                label="Active Account"
              />
              {errors.is_active && (
                <FormHelperText error>{errors.is_active}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2">
                  To reset a user's password, you need to create a new password for them.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UserEdit; 