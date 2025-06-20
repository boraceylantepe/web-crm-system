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
  CardHeader,
  Collapse,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Breadcrumbs,
  Link,
  Avatar,
  Checkbox,
  Toolbar,
  Stack,
  Badge
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
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Clear as ClearIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { getCustomers, searchCustomers, deleteCustomer } from '../services/customerService';
import { formatDate } from '../utils/dateUtils';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    region: '',
    engagement_level: '',
    status: '',
    is_active: 'all'
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  // Menu for customer actions
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  useEffect(() => {
    fetchCustomers();
  }, [filters, page, rowsPerPage, searchQuery]);
  
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };
      
      // Remove 'all' values from filters
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '') {
          delete params[key];
        }
      });
      
      // Add search parameter if search query exists
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      // Use the appropriate endpoint based on whether we need advanced search
      const data = searchQuery.trim() 
        ? await searchCustomers(params)
        : await getCustomers(params);
        
      setCustomers(Array.isArray(data.results) ? data.results : data);
      setTotalCount(data.count || data.length || 0);
    } catch (err) {
      setError('Failed to fetch customers. Please try again.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers();
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      region: '',
      engagement_level: '',
      status: '',
      is_active: 'all'
    });
    setSearchQuery('');
    setPage(0);
    // The useEffect will automatically trigger fetchCustomers when filters and searchQuery change
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(customers.map(customer => customer.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (customerId) => {
    setSelected(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleBulkDelete = () => {
    setBulkDeleteOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      await Promise.all(selected.map(id => deleteCustomer(id)));
      setCustomers(customers.filter(c => !selected.includes(c.id)));
      setSelected([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      setError('Failed to delete selected customers. Please try again.');
    }
  };
  
  const handleAddCustomer = () => {
    navigate('/customers/add');
  };
  
  const handleEditCustomer = (customer) => {
    setActionMenu(null);
    navigate(`/customers/edit/${customer.id}`);
  };
  
  const handleViewCustomer = (customer) => {
    setActionMenu(null);
    navigate(`/customers/${customer.id}`);
  };
  
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setConfirmDeleteOpen(true);
    setActionMenu(null);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteCustomer(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setConfirmDeleteOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError('Failed to delete customer. Please try again.');
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
  
  const getEngagementLevelColor = (level) => {
    switch(level?.toUpperCase()) {
      case 'HIGH': return 'success';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'error';
      case 'VIP': return 'primary';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'PROSPECT': return 'info';
      case 'LEAD': return 'warning';
      default: return 'default';
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs 
          aria-label="breadcrumb"
          separator={<NavigateNextIcon fontSize="small" />}
        >
          <Link 
            component={RouterLink} 
            to="/" 
            color="inherit" 
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none' }}
          >
            <HomeIcon fontSize="small" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
            Customers
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
          sx={{ textTransform: 'none' }}
          >
            Add Customer
          </Button>
        </Box>
        
        {/* Search and Filters */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
                        {/* Search Bar */}
            <Grid item xs={12} md={6}>
            <TextField
              fullWidth
                size="small"
                placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                  endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                        size="small" 
                        onClick={() => {
                          setSearchQuery('');
                          setPage(0);
                        }}
                    >
                        <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                  ),
              }}
            />
            </Grid>

            {/* Advanced Filters Toggle */}
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                endIcon={filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setFilterExpanded(!filterExpanded)}
                sx={{ textTransform: 'none' }}
              >
                Filters
              </Button>
            </Grid>

            {/* Clear Filters */}
            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Collapse in={filterExpanded}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Region</InputLabel>
                    <Select
                      value={filters.region}
                    label="Region"
                      onChange={handleFilterChange}
                    name="region"
                    >
                    <MenuItem value="">All Regions</MenuItem>
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
                
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Engagement Level</InputLabel>
                    <Select
                      value={filters.engagement_level}
                    label="Engagement Level"
                      onChange={handleFilterChange}
                    name="engagement_level"
                    >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="VIP">VIP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                    label="Status"
                      onChange={handleFilterChange}
                    name="status"
                    >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="LEAD">Lead</MenuItem>
                    <MenuItem value="PROSPECT">Prospect</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>
                  </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Active Status</InputLabel>
                  <Select
                    value={filters.is_active}
                    label="Active Status"
                    onChange={handleFilterChange}
                    name="is_active"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
        
      {/* Bulk Actions Toolbar */}
      {selected.length > 0 && (
        <Toolbar
          sx={{
            bgcolor: 'primary.light',
            borderRadius: 1,
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="subtitle1" color="primary.dark">
            {selected.length} customer{selected.length > 1 ? 's' : ''} selected
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            sx={{ textTransform: 'none' }}
          >
            Delete Selected
          </Button>
        </Toolbar>
      )}

      {/* Customers Table */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Customer List
            </Typography>
          }
          action={
            <Typography variant="body2" color="text.secondary">
              {totalCount} total customers
            </Typography>
          }
        />
        <Divider />

        <TableContainer>
          <Table stickyHeader>
                <TableHead>
                  <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper' }}>
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < customers.length}
                    checked={customers.length > 0 && selected.length === customers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      Loading customers...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">
                      No customers found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      hover
                    selected={selected.includes(customer.id)}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(customer.id)}
                        onChange={() => handleSelectOne(customer.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                      sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'primary.main',
                            fontSize: '1rem'
                          }}
                        >
                          {customer.name?.charAt(0) || customer.first_name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Customer ID #{customer.id}
                          </Typography>
                        </Box>
                        </Box>
                      </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '+1 555-123-4567'}</TableCell>
                      <TableCell>
                        <Chip 
                        label={customer.is_active ? 'Active' : 'Deactive'} 
                        color={customer.is_active ? 'success' : 'default'}
                          size="small" 
                        sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(event) => handleOpenActionMenu(event, customer)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                        <IconButton
                          size="small"
                        color="error"
                        onClick={() => handleDeleteClick(customer)}
                        >
                        <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                ))
              )}
                </TableBody>
              </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Items per page:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {page * rowsPerPage + 1} – {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount}
            </Typography>
              <TablePagination
                component="div"
              count={totalCount}
                page={page}
                onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              showFirstButton
              showLastButton
              labelDisplayedRows={() => ''}
              labelRowsPerPage=""
              sx={{ '.MuiTablePagination-toolbar': { minHeight: 'auto' } }}
            />
          </Box>
        </Box>
      </Card>
        
        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu}
          open={Boolean(actionMenu)}
          onClose={handleCloseActionMenu}
        >
        <MenuItem onClick={() => handleViewCustomer(selectedCustomer)}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
        <MenuItem onClick={() => handleEditCustomer(selectedCustomer)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Customer
          </MenuItem>
          <Divider />
        <MenuItem onClick={() => handleDeleteClick(selectedCustomer)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete Customer
          </MenuItem>
        </Menu>
        
        {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
            Are you sure you want to delete the customer "{customerToDelete?.name || customerToDelete?.first_name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
          <Button onClick={handleCancelDelete} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selected.length} selected customer{selected.length > 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Delete Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      </Box>
  );
  };
  
export default Customers; 