import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link, 
  CircularProgress,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { getCustomerById, deleteCustomer } from '../services/customerService';
import { formatDate, formatDateTime } from '../utils/dateUtils';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
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
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEdit = () => {
    navigate(`/customers/edit/${id}`);
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await deleteCustomer(id);
        navigate('/customers');
      } catch (err) {
        console.error('Error deleting customer:', err);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };
  
  // Get engagement level color
  const getEngagementLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'success';
      case 'HIGH':
        return 'warning';
      case 'VIP':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'error';
      case 'LEAD':
        return 'info';
      case 'PROSPECT':
        return 'warning';
      default:
        return 'default';
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
          <Typography color="textPrimary">
            {loading ? 'Customer Details' : customer?.name || 'Customer Details'}
          </Typography>
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
          <>
            {/* Customer Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" component="h1">{customer.name}</Typography>
                      <Typography variant="subtitle1" color="textSecondary">
                        {customer.company && `${customer.company} • `}
                        {customer.region_display}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" height="100%">
                    <Button 
                      startIcon={<EditIcon />}
                      variant="outlined"
                      color="primary"
                      onClick={handleEdit}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button 
                      startIcon={<DeleteIcon />}
                      variant="outlined"
                      color="error"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    <Chip 
                      label={customer.status_display} 
                      color={getStatusColor(customer.status)}
                    />
                    <Chip 
                      label={`Engagement: ${customer.engagement_level_display}`} 
                      color={getEngagementLevelColor(customer.engagement_level)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Overview" />
                <Tab label="Activities" />
                <Tab label="Notes" />
              </Tabs>
              
              {/* Overview Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email" 
                          secondary={
                            <Link href={`mailto:${customer.email}`} color="primary">
                              {customer.email}
                            </Link>
                          } 
                        />
                      </ListItem>
                      
                      {customer.phone && (
                        <ListItem>
                          <ListItemIcon>
                            <PhoneIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Phone" 
                            secondary={
                              <Link href={`tel:${customer.phone}`} color="primary">
                                {customer.phone}
                              </Link>
                            } 
                          />
                        </ListItem>
                      )}
                      
                      {customer.company && (
                        <ListItem>
                          <ListItemIcon>
                            <BusinessIcon />
                          </ListItemIcon>
                          <ListItemText primary="Company" secondary={customer.company} />
                        </ListItem>
                      )}
                      
                      {(customer.website || customer.linkedin) && (
                        <>
                          {customer.website && (
                            <ListItem>
                              <ListItemIcon>
                                <LanguageIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Website" 
                                secondary={
                                  <Link href={customer.website} target="_blank" rel="noopener" color="primary">
                                    {customer.website}
                                  </Link>
                                } 
                              />
                            </ListItem>
                          )}
                          
                          {customer.linkedin && (
                            <ListItem>
                              <ListItemIcon>
                                <LinkedInIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary="LinkedIn" 
                                secondary={
                                  <Link href={customer.linkedin} target="_blank" rel="noopener" color="primary">
                                    {customer.linkedin}
                                  </Link>
                                } 
                              />
                            </ListItem>
                          )}
                        </>
                      )}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Address</Typography>
                    {customer.address || customer.city || customer.country ? (
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <LocationIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Location" 
                            secondary={
                              <>
                                {customer.address && (<div>{customer.address}</div>)}
                                {customer.city && (<div>{customer.city}</div>)}
                                {customer.country && (<div>{customer.country}</div>)}
                              </>
                            } 
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <PublicIcon />
                          </ListItemIcon>
                          <ListItemText primary="Region" secondary={customer.region_display} />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography color="textSecondary">No address information provided</Typography>
                    )}
                  </Grid>
                  
                  {customer.notes && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>Notes</Typography>
                      <Typography variant="body1" component="div" whiteSpace="pre-wrap">
                        {customer.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
              
              {/* Activities Tab - Placeholder for future features */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                <Typography variant="body1" color="textSecondary">
                  No activities found for this customer.
                </Typography>
              </TabPanel>
              
              {/* Notes Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Notes</Typography>
                {customer.notes ? (
                  <Typography variant="body1" component="div" whiteSpace="pre-wrap">
                    {customer.notes}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    No notes have been added for this customer.
                  </Typography>
                )}
              </TabPanel>
            </Paper>
          </>
        )}
      </Box>
      {customer && (
        <Typography variant="body2" color="text.secondary">
          Created: {formatDate(customer.created_at)} | Updated: {formatDate(customer.updated_at)}
        </Typography>
      )}
    </Container>
  );
};

export default CustomerDetail; 