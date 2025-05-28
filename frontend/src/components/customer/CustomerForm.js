import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Typography,
  Paper,
  Divider,
  Card,
  CardContent,
  Stack,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getCustomerById, updateCustomer, createCustomer } from '../../services/customerService';

const CustomerForm = ({ customerId = null, initialData = {} }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    region: 'OTHER',
    engagement_level: 'MEDIUM',
    status: 'ACTIVE',
    website: '',
    linkedin: '',
    notes: '',
    is_active: true,
    ...initialData
  });
  
  const isEditMode = !!customerId;
  
  useEffect(() => {
    // If we're in edit mode and don't have initial data, fetch the customer
    if (isEditMode && Object.keys(initialData).length === 0) {
      fetchCustomer();
    }
  }, [customerId, initialData]);
  
  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const customer = await getCustomerById(customerId);
      setFormData(customer);
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    let valid = true;
    let newErrors = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }
    
    // Validate website format if provided
    if (formData.website && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
      valid = false;
    }
    
    // Validate LinkedIn format if provided
    if (formData.linkedin && !/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/.test(formData.linkedin)) {
      newErrors.linkedin = 'Invalid LinkedIn URL';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Create a copy of the form data to avoid modifying state directly
    const processedData = { ...formData };
    
    // Add https:// prefix to website if it doesn't have http:// or https://
    if (processedData.website && !processedData.website.match(/^https?:\/\//)) {
      processedData.website = `https://${processedData.website}`;
    }
    
    // Add https:// prefix to LinkedIn if it doesn't have http:// or https://
    if (processedData.linkedin && !processedData.linkedin.match(/^https?:\/\//)) {
      processedData.linkedin = `https://${processedData.linkedin}`;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode) {
        await updateCustomer(customerId, processedData);
      } else {
        await createCustomer(processedData);
      }
      
      // Navigate back to customers list on success
      navigate('/customers');
    } catch (err) {
      console.error('Error saving customer:', err);
      
      // Handle API validation errors
      if (err.response?.data) {
        setErrors(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component={Paper} p={4} sx={{ borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="medium" color="primary">
        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Basic Information */}
          <Card variant="outlined" sx={{ overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" color="primary.dark" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    name="name"
                    label="Customer Name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label="Phone Number"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="company"
                    label="Company Name"
                    value={formData.company || ''}
                    onChange={handleChange}
                    error={!!errors.company}
                    helperText={errors.company}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.region} disabled={loading} variant="outlined">
                        <InputLabel>Region</InputLabel>
                        <Select
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          label="Region"
                        >
                          <MenuItem value="NA">North America</MenuItem>
                          <MenuItem value="EU">Europe</MenuItem>
                          <MenuItem value="APAC">Asia Pacific</MenuItem>
                          <MenuItem value="LATAM">Latin America</MenuItem>
                          <MenuItem value="MENA">Middle East & North Africa</MenuItem>
                          <MenuItem value="AF">Africa</MenuItem>
                          <MenuItem value="OTHER">Other</MenuItem>
                        </Select>
                        {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.engagement_level} disabled={loading} variant="outlined">
                        <InputLabel>Engagement Level</InputLabel>
                        <Select
                          name="engagement_level"
                          value={formData.engagement_level}
                          onChange={handleChange}
                          label="Engagement Level"
                        >
                          <MenuItem value="LOW">Low</MenuItem>
                          <MenuItem value="MEDIUM">Medium</MenuItem>
                          <MenuItem value="HIGH">High</MenuItem>
                          <MenuItem value="VIP">VIP</MenuItem>
                        </Select>
                        {errors.engagement_level && <FormHelperText>{errors.engagement_level}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.status} disabled={loading} variant="outlined">
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          label="Status"
                        >
                          <MenuItem value="ACTIVE">Active</MenuItem>
                          <MenuItem value="INACTIVE">Inactive</MenuItem>
                          <MenuItem value="LEAD">Lead</MenuItem>
                          <MenuItem value="PROSPECT">Prospect</MenuItem>
                        </Select>
                        {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Address Information */}
          <Card variant="outlined" sx={{ overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" color="primary.dark" gutterBottom>
                Address Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address"
                    label="Street Address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    error={!!errors.address}
                    helperText={errors.address}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="city"
                    label="City"
                    value={formData.city || ''}
                    onChange={handleChange}
                    error={!!errors.city}
                    helperText={errors.city}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="country"
                    label="Country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    error={!!errors.country}
                    helperText={errors.country}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Additional Information */}
          <Card variant="outlined" sx={{ overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" color="primary.dark" gutterBottom>
                Additional Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="website"
                    label="Website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    error={!!errors.website}
                    helperText={errors.website || "e.g. example.com or www.example.com"}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="linkedin"
                    label="LinkedIn Profile"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    error={!!errors.linkedin}
                    helperText={errors.linkedin || "e.g. linkedin.com/in/username"}
                    disabled={loading}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="notes"
                    label="Notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    error={!!errors.notes}
                    helperText={errors.notes}
                    disabled={loading}
                    multiline
                    rows={4}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
            <Button 
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/customers')}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              size="large"
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Create Customer')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default CustomerForm; 