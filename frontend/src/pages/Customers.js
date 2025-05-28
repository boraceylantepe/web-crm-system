import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Collapse,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCustomers, searchCustomers, deleteCustomer } from '../services/customerService';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    engagement_level: '',
    status: '',
    is_active: true
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  
  // Menu for customer actions
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  useEffect(() => {
    fetchCustomers();
  }, [filters, page, rowsPerPage]);
  
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };
      
      // Use search endpoint if a search query exists
      if (searchQuery) {
        params.q = searchQuery;
        const data = await searchCustomers(params);
        setCustomers(data);
      } else {
        const data = await getCustomers(params);
        setCustomers(Array.isArray(data.results) ? data.results : data);
      }
    } catch (err) {
      setError('Failed to fetch customers. Please try again.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setPage(0); // Reset to first page when filters change
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleAddCustomer = () => {
    navigate('/customers/add');
  };
  
  const handleEditCustomer = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
    handleCloseActionMenu();
  };
  
  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
    handleCloseActionMenu();
  };
  
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmDeleteOpen(true);
    handleCloseActionMenu();
  };
  
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete.id);
      // Remove the deleted customer from the state
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setConfirmDeleteOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError('Failed to delete the customer. Please try again.');
      console.error('Error deleting customer:', err);
    }
  };
  
  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setCustomerToDelete(null);
  };
  
  const handleOpenActionMenu = (event, customer) => {
    setActionMenu(event.currentTarget);
    setSelectedCustomer(customer);
  };
  
  const handleCloseActionMenu = () => {
    setActionMenu(null);
    setSelectedCustomer(null);
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Customers
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        </Box>
        
        {/* Search and Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search customers by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setFilterExpanded(!filterExpanded)}
                      aria-label="toggle advanced filters"
                    >
                      <FilterIcon />
                      {filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          <Collapse in={filterExpanded}>
            <Box sx={{ pt: 2, pb: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Advanced Filters
              </Typography>
              <Grid container spacing={8}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Region</InputLabel>
                    <Select
                      name="region"
                      value={filters.region}
                      onChange={handleFilterChange}
                      label="Region"
                    >
                      <MenuItem value="ANY">Any</MenuItem>
                      <MenuItem value="NA">North America</MenuItem>
                      <MenuItem value="EU">Europe</MenuItem>
                      <MenuItem value="APAC">Asia Pacific</MenuItem>
                      <MenuItem value="LATAM">Latin America</MenuItem>
                      <MenuItem value="MENA">Middle East & North Africa</MenuItem>
                      <MenuItem value="AF">Africa</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Engagement Level</InputLabel>
                    <Select
                      name="engagement_level"
                      value={filters.engagement_level}
                      onChange={handleFilterChange}
                      label="Engagement Level"
                    >
                      <MenuItem value="ANY">Any</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="VIP">VIP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      label="Status"
                    >
                      <MenuItem value="ANY">Any</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                      <MenuItem value="LEAD">Lead</MenuItem>
                      <MenuItem value="PROSPECT">Prospect</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  size="medium"
                  onClick={() => {
                    setFilters({
                      region: '',
                      engagement_level: '',
                      status: '',
                      is_active: true
                    });
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Paper>
        
        {/* Error message */}
        {error && (
          <Typography color="error" variant="body1" sx={{ my: 2 }}>
            {error}
          </Typography>
        )}
        
        {/* Customer list */}
        {loading ? (
          <Typography>Loading customers...</Typography>
        ) : customers.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">No customers found</Typography>
            <Typography variant="body2">
              Try adjusting your search filters or add a new customer.
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>Engagement</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      hover
                      onClick={() => handleViewCustomer(customer)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ mr: 1 }} fontSize="small" />
                          {customer.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <EmailIcon sx={{ mr: 1 }} fontSize="small" />
                          {customer.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {customer.company && (
                          <Box display="flex" alignItems="center">
                            <BusinessIcon sx={{ mr: 1 }} fontSize="small" />
                            {customer.company}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{customer.region_display}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={customer.engagement_level_display} 
                          color={getEngagementLevelColor(customer.engagement_level)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={customer.status_display} 
                          color={getStatusColor(customer.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="customer actions"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            handleOpenActionMenu(e, customer);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={-1} // We don't know the total count, so use -1 to indicate infinite
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </>
        )}
        
        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu}
          open={Boolean(actionMenu)}
          onClose={handleCloseActionMenu}
        >
          <MenuItem onClick={() => selectedCustomer && handleViewCustomer(selectedCustomer)}>
            View Details
          </MenuItem>
          <MenuItem onClick={() => selectedCustomer && handleEditCustomer(selectedCustomer)}>
            Edit Customer
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => selectedCustomer && handleDeleteClick(selectedCustomer)}
            sx={{ color: 'error.main' }}
          >
            Delete Customer
          </MenuItem>
        </Menu>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={handleCancelDelete}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete customer "{customerToDelete?.name}"? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Customers; 