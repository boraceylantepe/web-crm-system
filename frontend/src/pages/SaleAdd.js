import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { createSale, createSaleNote } from '../services/saleService';
import { getCustomers } from '../services/customerService';

const SaleAdd = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    customer: '',
    status: 'NEW',
    amount: '',
    expected_close_date: '',
    description: '',
    priority: 'MEDIUM'
  });
  
  // Status options
  const statusOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'PROPOSAL', label: 'Proposal Sent' },
    { value: 'NEGOTIATION', label: 'Negotiation' },
    { value: 'WON', label: 'Won' },
    { value: 'LOST', label: 'Lost' }
  ];
  
  // Priority options
  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }
  ];
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      // Ensure customers is always an array, handling different API response formats
      const customersArray = Array.isArray(data) ? data : 
                             data && data.results ? data.results : [];
      setCustomers(customersArray);
      
      // Set default customer if available
      if (customersArray.length > 0) {
        setFormData(prev => ({
          ...prev,
          customer: customersArray[0].id
        }));
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    
    if (!formData.customer) {
      setError('Please select a customer.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Make API request to create the sale
      const sale = await createSale({
        ...formData,
        // Format the expected close date if needed
        expected_close_date: formData.expected_close_date || null
      });
      
      // Add initial note if description exists
      if (formData.description) {
        try {
          await createSaleNote({ 
            sale: sale.id,
            content: `Initial description: ${formData.description}` 
          });
        } catch (noteError) {
          console.error('Error creating initial note:', noteError);
          // Continue even if note creation fails
        }
      }
      
      // Redirect to the sale detail page
      navigate(`/sales/${sale.id}`);
    } catch (err) {
      console.error('Error creating sale:', err);
      // Show the specific error message if available
      setError(err.message || 'Failed to create sale opportunity. Please try again.');
      setLoading(false);
    }
  };
  
  const goBack = () => {
    navigate('/sales');
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Sales Opportunity
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* First row */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter opportunity title"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                required
                label="Customer"
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                variant="outlined"
                sx={{ minWidth: '200px' }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        minWidth: '300px'
                      }
                    }
                  }
                }}
              >
                <MenuItem value="">Select a customer...</MenuItem>
                {Array.isArray(customers) && customers.map(customer => (
                  <MenuItem 
                    key={customer.id} 
                    value={customer.id}
                    sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                  >
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            {/* Second row */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                variant="outlined"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                variant="outlined"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Amount ($)"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter deal value"
                variant="outlined"
              />
            </Grid>
            
            {/* Third row */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Close Date"
                name="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={handleInputChange}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter details about this opportunity..."
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={goBack}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Opportunity"}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Creating a New Opportunity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography paragraph>
              A sales opportunity represents a potential deal with a customer. Here are some tips:
            </Typography>
            <ul>
              <li>
                <Typography>Give your opportunity a clear, descriptive title</Typography>
              </li>
              <li>
                <Typography>Select the appropriate customer from the dropdown</Typography>
              </li>
              <li>
                <Typography>Add a detailed description to help track the opportunity</Typography>
              </li>
              <li>
                <Typography>Set an expected close date for forecasting</Typography>
              </li>
            </ul>
            <Typography>
              After creating the opportunity, you can add notes, tasks, and track its progress
              through the sales pipeline.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SaleAdd; 