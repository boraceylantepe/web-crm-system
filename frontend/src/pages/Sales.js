import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Box,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AttachMoney as MoneyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { getSalesPipeline, getSalesStats, updateSaleStatus, deleteSale, getSales } from '../services/saleService';
import { SALE_STATUSES } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesPipeline, setSalesPipeline] = useState({});
  const [stats, setStats] = useState({});
  const [view, setView] = useState('kanban'); // 'kanban' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  
  const navigate = useNavigate();
  
  // Status colors mapping
  const statusColors = {
    'NEW': 'primary',
    'CONTACTED': 'info',
    'PROPOSAL': 'warning',
    'NEGOTIATION': 'secondary',
    'WON': 'success',
    'LOST': 'error'
  };
  
  // Status display mapping
  const statusDisplay = {
    'NEW': 'New',
    'CONTACTED': 'Contacted',
    'PROPOSAL': 'Proposal Sent',
    'NEGOTIATION': 'Negotiation',
    'WON': 'Won',
    'LOST': 'Lost'
  };
  
  // Priority colors mapping
  const priorityColors = {
    'LOW': 'success',
    'MEDIUM': 'warning',
    'HIGH': 'error'
  };

  useEffect(() => {
    fetchSalesPipeline();
    fetchSalesStats();
    if (view === 'list') {
      fetchSalesList();
    }
  }, [view, filterStatus, sortField, sortDirection, page, rowsPerPage]);
  
  const performSearch = (term) => {
    console.log('Performing search with term:', term);
    setLoading(true);
    
    if (view === 'list') {
      const params = {
        limit: rowsPerPage,
        offset: 0, // Always reset to first page for search
        ordering: sortDirection === 'desc' ? `-${sortField}` : sortField,
        search: term || '' // Ensure search term is always present
      };
      
      if (filterStatus) {
        params.status = filterStatus;
      }
      
      console.log('List view search params:', params);
      
      getSales(params)
        .then(result => {
          console.log('List view search results:', result);
          setSalesList(result.results || []);
          setTotalSales(result.count || 0);
          setPage(0); // Reset pagination
          setLoading(false);
        })
        .catch(err => {
          console.error('Error searching sales for list view:', err);
          setError('Failed to search sales. Please try again.');
          setLoading(false);
        });
    } else {
      // Kanban view search (this part was working)
      const params = {};
      if (term) {
        params.search = term;
      }
      
      getSalesPipeline(params).then(pipelineData => {
        setSalesPipeline(pipelineData);
        setLoading(false);
      }).catch(err => {
        console.error('Error searching pipeline:', err);
        setError('Failed to search pipeline. Please try again.');
        setLoading(false);
      });
    }
  };
  
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    performSearch(searchTerm);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    performSearch(''); // Perform search with empty term to refresh
  };
  
  const fetchSalesPipeline = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching sales pipeline with search term:', searchTerm);
      const params = {};
      
      // Only add search parameter if it's not empty
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      console.log('Pipeline request params:', params);
      const pipelineData = await getSalesPipeline(params);
      
      console.log('Pipeline data received:', pipelineData);
      
      // Check if we have data for each status
      const statuses = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
      statuses.forEach(status => {
        console.log(`Status ${status}: ${pipelineData[status]?.length || 0} sales`);
      });
      
      setSalesPipeline(pipelineData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sales pipeline:', err);
      setError('Failed to load sales pipeline. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchSalesStats = async () => {
    try {
      const statsData = await getSalesStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching sales stats:', err);
    }
  };
  
  const fetchSalesList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching sales list with search term:', searchTerm);
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ordering: sortDirection === 'desc' ? `-${sortField}` : sortField
      };
      
      if (filterStatus) {
        params.status = filterStatus;
      }
      
      // Only add search parameter if it's not empty
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      console.log('List request params:', params);
      const result = await getSales(params);
      console.log('List data received:', result);
      
      setSalesList(result.results || []);
      setTotalSales(result.count || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sales list:', err);
      setError('Failed to load sales list. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleDragStart = (e, saleId, currentStatus) => {
    e.dataTransfer.setData('saleId', saleId);
    e.dataTransfer.setData('currentStatus', currentStatus);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const saleId = e.dataTransfer.getData('saleId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    if (currentStatus === newStatus) return;
    
    try {
      // Optimistically update the UI
      const saleToMove = salesPipeline[currentStatus]?.find(s => s.id.toString() === saleId);
      if (!saleToMove) return;

      // Update local state
      setSalesPipeline(prevPipeline => {
        const newPipeline = { ...prevPipeline };
        // Remove from old status
        newPipeline[currentStatus] = newPipeline[currentStatus]?.filter(s => s.id.toString() !== saleId);
        // Add to new status
        newPipeline[newStatus] = [...(newPipeline[newStatus] || []), { ...saleToMove, status: newStatus }];
        return newPipeline;
      });

      // Optimistically update Won Opportunities count
      setStats(prevStats => {
        if (!prevStats || !prevStats.status_counts) return prevStats;
        const newStats = { ...prevStats, status_counts: { ...prevStats.status_counts } };
        if (currentStatus !== 'WON' && newStatus === 'WON') {
          // Bir fırsat WON'a taşındı
          newStats.status_counts.WON = (newStats.status_counts.WON || 0) + 1;
        } else if (currentStatus === 'WON' && newStatus !== 'WON') {
          // Bir fırsat WON'dan çıkarıldı
          newStats.status_counts.WON = Math.max(0, (newStats.status_counts.WON || 1) - 1);
        }
        return newStats;
      });

      await updateSaleStatus(saleId, newStatus);
      // Fetch stats, as totals might have changed, but pipeline is updated locally
      fetchSalesStats();
    } catch (err) {
      console.error('Error updating sale status:', err);
      setError('Failed to update sale status. Please try again.');
      // If error, revert optimistic update by fetching fresh data
      fetchSalesPipeline();
    }
  };
  
  const handleAddSale = () => {
    navigate('/sales/add');
  };
  
  const handleSaleClick = (saleId) => {
    navigate(`/sales/${saleId}`);
  };
  
  const handleDeleteSale = async (saleId, status) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      // Define originalPipeline outside the try block to ensure it's in scope for catch
      let originalPipeline = {}; 
      try {
        // Optimistically update the UI
        originalPipeline = { ...salesPipeline }; // Assign here
        setSalesPipeline(prevPipeline => {
          const newPipeline = { ...prevPipeline };
          newPipeline[status] = newPipeline[status]?.filter(s => s.id.toString() !== saleId);
          return newPipeline;
        });

        await deleteSale(saleId);
        // Refresh both stats and pipeline after deletion
        fetchSalesStats();
        fetchSalesPipeline();
      } catch (err) {
        console.error('Error deleting sale:', err);
        setError('Failed to delete opportunity. Please try again.');
        // If error, revert optimistic update
        setSalesPipeline(originalPipeline);
      }
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterClick = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setFilterMenuAnchor(null);
    setPage(0);
  };
  
  const handleSortClick = () => {
    setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
  };
  
  const renderKanbanBoard = () => {
    console.log("Rendering Kanban board with data:", salesPipeline);
    
    // Check if salesPipeline is valid
    if (!salesPipeline || typeof salesPipeline !== 'object') {
      console.error("Invalid salesPipeline data:", salesPipeline);
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Error loading sales data. Please refresh the page.</Alert>
        </Box>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', overflowX: 'auto', minHeight: '600px' }}>
        {Object.keys(statusDisplay).map(status => {
          // Get sales for this status, safely
          const salesForStatus = Array.isArray(salesPipeline[status]) ? salesPipeline[status] : [];
          console.log(`Status ${status} has ${salesForStatus.length} sales`);
          
          return (
            <Box 
              key={status} 
              sx={{ 
                width: '300px', 
                minWidth: '300px', 
                mx: 1, 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              <Paper 
                sx={{ 
                  mb: 2, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: statusColors[status] === 'error' ? '#fdeded' : 
                           statusColors[status] === 'warning' ? '#fff4e5' : 
                           statusColors[status] === 'info' ? '#e5f6fd' : 
                           statusColors[status] === 'success' ? '#edf7ed' : 
                           statusColors[status] === 'secondary' ? '#f5e7ff' : '#e3f2fd'
                }}
              >
                <Box sx={{ 
                  p: 1, 
                  bgcolor: statusColors[status] === 'error' ? '#f44336' : 
                            statusColors[status] === 'warning' ? '#ff9800' : 
                            statusColors[status] === 'info' ? '#03a9f4' : 
                            statusColors[status] === 'success' ? '#4caf50' : 
                            statusColors[status] === 'secondary' ? '#9c27b0' : '#1976d2',
                  color: 'white',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {statusDisplay[status]}
                  </Typography>
                  <Chip 
                    label={salesForStatus.length} 
                    size="small" 
                    sx={{ bgcolor: 'white', color: 'text.primary' }} 
                  />
                </Box>
                <Box 
                  sx={{ 
                    p: 2, 
                    flex: 1, 
                    overflowY: 'auto',
                    minHeight: '400px'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {salesForStatus.length > 0 ? (
                    salesForStatus.map(sale => {
                      console.log(`Rendering sale:`, sale);
                      return (
                        <Card 
                          key={sale.id} 
                          sx={{ 
                            mb: 2, 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: 3
                            }
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, sale.id, sale.status)}
                          onClick={() => handleSaleClick(sale.id)}
                        >
                          <CardContent sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {sale.title || 'Untitled Opportunity'}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSale(sale.id, status);
                                }}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': {
                                    bgcolor: 'error.lighter'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                {sale.customer_name || sale.customer_details?.name || 'Unknown Customer'}
                              </Typography>
                              <Chip 
                                label={sale.priority_display || sale.priority || 'Medium'} 
                                size="small" 
                                color={
                                  (sale.priority === 'HIGH' || sale.priority_display === 'High') ? 'error' : 
                                  (sale.priority === 'MEDIUM' || sale.priority_display === 'Medium') ? 'warning' : 'success'
                                }
                              />
                            </Box>
                            {sale.amount && (
                              <Box sx={{ textAlign: 'right', mb: 1 }}>
                                <Typography fontWeight="bold">
                                  ${typeof sale.amount === 'string' ? parseFloat(sale.amount).toLocaleString() : (Number(sale.amount) || 0).toLocaleString()}
                                </Typography>
                              </Box>
                            )}
                            {sale.expected_close_date && (
                              <Typography variant="body2" color="text.secondary">
                                Expected: {formatDate(sale.expected_close_date)}
                              </Typography>
                            )}
                            {(sale.assigned_to_details || sale.assigned_to_name) && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Assigned: {sale.assigned_to_details?.full_name || sale.assigned_to_name || 'Unassigned'}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No sales in this stage</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  const renderListView = () => {
    return (
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Expected Close</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesList.length > 0 ? (
                salesList.map((sale) => (
                  <TableRow 
                    key={sale.id} 
                    hover
                    onClick={() => handleSaleClick(sale.id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell>{sale.title}</TableCell>
                    <TableCell>{sale.customer_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={sale.status_display || statusDisplay[sale.status]} 
                        color={statusColors[sale.status]}
                      />
                    </TableCell>
                    <TableCell>
                      ${typeof sale.amount === 'string' 
                        ? parseFloat(sale.amount).toLocaleString() 
                        : (Number(sale.amount) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={sale.priority_display || sale.priority || 'Medium'} 
                        color={priorityColors[sale.priority] || 'warning'}
                      />
                    </TableCell>
                    <TableCell>{sale.expected_close_date ? formatDate(sale.expected_close_date) : 'Not set'}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id, sale.status);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sales/edit/${sale.id}`);
                        }}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No sales opportunities found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalSales}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Sales Pipeline</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddSale}
        >
          Add Opportunity
        </Button>
      </Box>
      
      {/* Pipeline Stats */}
      {!loading && stats.status_counts && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Opportunities
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.total_count}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pipeline Value
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>
                  ${Number(stats.total_value).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Won Opportunities
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>
                  {stats.status_counts?.WON || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Filter and View Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit}>
            <TextField
              size="small"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit(e);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchTerm && (
                      <IconButton 
                        onClick={handleClearSearch}
                        size="small"
                        aria-label="clear search"
                        type="button"
                        sx={{ mr: 0.5 }}
                      >
                        <Divider orientation="vertical" flexItem sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="error">Clear</Typography>
                      </IconButton>
                    )}
                    <IconButton 
                      onClick={handleSearchSubmit}
                      size="small"
                      aria-label="search"
                      type="button"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ width: 300 }}
            />
          </form>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(e, newView) => newView && setView(newView)}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="kanban" aria-label="kanban view">
              Kanban
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              List
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Filter Menu */}
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterChange('')}>All Statuses</MenuItem>
            <Divider />
            {Object.keys(statusDisplay).map((status) => (
              <MenuItem key={status} onClick={() => handleFilterChange(status)}>
                <Chip 
                  size="small" 
                  label={statusDisplay[status]} 
                  color={statusColors[status]}
                  sx={{ mr: 1 }}
                />
                {statusDisplay[status]}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>
      
      {/* Loading, Error and Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: '#fdeded' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : (
        <>
          {view === 'kanban' ? (
            renderKanbanBoard()
          ) : (
            renderListView()
          )}
        </>
      )}
    </Container>
  );
};

export default Sales; 