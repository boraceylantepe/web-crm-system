import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CustomerForm from '../components/customer/CustomerForm';

const CustomerAdd = () => {
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
          <Typography color="textPrimary">Add New Customer</Typography>
        </Breadcrumbs>
        
        <CustomerForm />
      </Box>
    </Container>
  );
};

export default CustomerAdd; 