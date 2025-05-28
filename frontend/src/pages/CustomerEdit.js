import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Breadcrumbs, Link, CircularProgress } from '@mui/material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import CustomerForm from '../components/customer/CustomerForm';
import { getCustomerById } from '../services/customerService';

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchCustomer();
  }, [id]);
  
  const fetchCustomer = async () => {
    try {
      const data = await getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer data. Please try again.');
      
      // Redirect to customers list if the customer doesn't exist
      if (err.response?.status === 404) {
        navigate('/customers');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/customers" color="inherit">
            Customers
          </Link>
          <Typography color="textPrimary">Edit Customer</Typography>
        </Breadcrumbs>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" variant="h6" align="center" my={4}>
            {error}
          </Typography>
        ) : (
          <CustomerForm customerId={id} initialData={customer} />
        )}
      </Box>
    </Container>
  );
};

export default CustomerEdit; 