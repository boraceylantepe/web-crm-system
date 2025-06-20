import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Avatar,
  LinearProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as SalesIcon,
  Task as TaskIcon,
  Event as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { getCustomers } from '../services/customerService';
import { getSalesPipeline, getSalesStats, getSales } from '../services/saleService';
import taskService from '../services/taskService';
import calendarService from '../services/calendarService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { LineChart, MetricCard } from '../components/charts/ChartComponents';
import reportingService from '../services/reportingService';

const KPICard = ({ title, value, icon, color, trend, trendValue, trendDirection, period, link }) => {
  const TrendIcon = trendDirection === 'up' ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = trendDirection === 'up' ? 'success.main' : 'error.main';
  
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: 1,
        borderColor: 'divider',
        transition: 'all 0.3s ease-in-out',
        cursor: link ? 'pointer' : 'default',
        '&:hover': {
          transform: link ? 'translateY(-4px)' : 'none',
          boxShadow: link ? 4 : 1,
        }
      }}
      onClick={link ? () => window.location.href = link : undefined}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
          {title}
        </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          {value}
        </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
                <Typography variant="body2" sx={{ color: trendColor, fontWeight: 'medium' }}>
                  {trendValue}
                </Typography>
              </Box>
            )}
      </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 24 } })}
          </Box>
      </Box>
        
        {period && (
          <Typography variant="caption" color="text.secondary">
            {period}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const DataTableCard = ({ 
  title, 
  data, 
  loading, 
  emptyMessage, 
  link, 
  icon, 
  color,
  columns,
  renderRow,
  actions = []
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState([]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(data.map((_, index) => index));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (index) => {
    setSelected(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && React.cloneElement(icon, { sx: { color: `${color}.main` } })}
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
      </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                displayEmpty
              >
                <MenuItem value="This Week">This Week</MenuItem>
                <MenuItem value="This Month">This Month</MenuItem>
                <MenuItem value="Last Month">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      
      <CardContent sx={{ p: 0, height: 'calc(100% - 140px)', display: 'flex', flexDirection: 'column' }}>
      {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
        ) : filteredData.length > 0 ? (
          <>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>
                      <Checkbox
                        indeterminate={selected.length > 0 && selected.length < data.length}
                        checked={data.length > 0 && selected.length === data.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow 
                      key={index}
                      hover
                      selected={selected.includes(index)}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(index)}
                          onChange={() => handleSelectOne(index)}
                        />
                      </TableCell>
                      {renderRow(row, index)}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: 1, borderColor: 'divider' }}>
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
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  {page * rowsPerPage + 1} – {Math.min((page + 1) * rowsPerPage, filteredData.length)} of {filteredData.length}
                </Typography>
                <TablePagination
                  component="div"
                  count={filteredData.length}
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
          </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    customers: [],
    recentSales: [],
    tasks: [],
    events: [],
    stats: {},
    kpis: null,
    salesStats: null,
    loading: true,
  });

  const getStatusDisplay = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress', 
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
  };
  
  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'warning',
      'IN_PROGRESS': 'primary',
      'COMPLETED': 'success',
      'CANCELLED': 'error'
    };
    return colorMap[status] || 'default';
  };
  
  const getPriorityDisplay = (priority) => {
    const priorityMap = {
      'LOW': 'Low',
      'MEDIUM': 'Medium',
      'HIGH': 'High',
      'URGENT': 'Urgent'
    };
    return priorityMap[priority] || priority;
  };
  
  const getPriorityColor = (priority) => {
    const colorMap = {
      'LOW': 'success',
      'MEDIUM': 'primary',
      'HIGH': 'warning',
      'URGENT': 'error'
    };
    return colorMap[priority] || 'default';
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          customersResponse,
          salesResponse,
          tasksResponse,
          eventsResponse,
          salesStatsResponse,
          kpisResponse
        ] = await Promise.all([
          getCustomers({ limit: 10 }),
          getSales({ limit: 10 }),
          taskService.getTasks({ limit: 10 }),
          calendarService.getCalendarEvents({ limit: 10 }),
          getSalesStats(),
          reportingService.analytics.getDashboardKPIs()
        ]);

        const stats = {
          totalCustomers: customersResponse.count || customersResponse.length || 0,
          totalSales: salesResponse.count || salesResponse.length || 0,
          pendingTasks: tasksResponse.results?.filter(task => task.status === 'PENDING').length || 0,
          upcomingEvents: eventsResponse.results?.length || 0,
        };

        setDashboardData({
          customers: customersResponse.results || customersResponse || [],
          recentSales: salesResponse.results || salesResponse || [],
          tasks: tasksResponse.results || tasksResponse || [],
          events: eventsResponse.results || eventsResponse || [],
          stats,
          kpis: kpisResponse.data,
          salesStats: salesStatsResponse,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLargeNumber = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(2);
  };



  // Revenue Analytics Component
  const RevenueAnalyticsCard = () => {
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('6months');

         useEffect(() => {
       const generateRevenueData = () => {
         console.log('=== Revenue Analytics Debug ===');
         console.log('All sales data:', dashboardData.recentSales);
         console.log('Won sales:', dashboardData.recentSales.filter(sale => sale.status === 'WON'));
         
         const months = [];
         const currentDate = new Date();
         const monthsToShow = timeRange === '6months' ? 6 : timeRange === '12months' ? 12 : 3;
         
         for (let i = monthsToShow - 1; i >= 0; i--) {
           const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
           const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
           
           // Debug: Check different date fields and status values
           const wonSales = dashboardData.recentSales.filter(sale => {
             console.log(`Sale ${sale.id}:`, {
               status: sale.status,
               amount: sale.amount,
               updated_at: sale.updated_at,
               created_at: sale.created_at,
               expected_close_date: sale.expected_close_date
             });
             return sale.status === 'WON';
           });
           
           console.log(`Won sales for filtering:`, wonSales);
           
           // Calculate revenue from won sales for this month
           // Try multiple date fields and be more flexible with status
           const monthRevenue = dashboardData.recentSales
             .filter(sale => {
               // More flexible status checking
               const isWon = sale.status === 'WON' || sale.status === 'won' || sale.status === 'Won';
               if (!isWon) return false;
               
               // Function to parse DD/MM/YYYY HH:MM format
               const parseDateString = (dateStr) => {
                 if (!dateStr) return null;
                 
                 // Handle YYYY-MM-DD format (expected_close_date)
                 if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                   return new Date(dateStr);
                 }
                 
                 // Handle DD/MM/YYYY HH:MM format (created_at, updated_at)
                 const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
                 if (match) {
                   const [, day, month, year] = match;
                   // JavaScript Date constructor expects MM/DD/YYYY, so we convert
                   return new Date(`${month}/${day}/${year}`);
                 }
                 
                 // Fallback to standard parsing
                 return new Date(dateStr);
               };
               
               // Try multiple date fields with proper parsing
               let saleDate = null;
               if (sale.expected_close_date) {
                 saleDate = parseDateString(sale.expected_close_date);
               } else if (sale.updated_at) {
                 saleDate = parseDateString(sale.updated_at);
               } else if (sale.created_at) {
                 saleDate = parseDateString(sale.created_at);
               }
               
               if (!saleDate || isNaN(saleDate.getTime())) {
                 console.log(`Invalid date for sale ${sale.id}:`, {
                   expected_close_date: sale.expected_close_date,
                   updated_at: sale.updated_at,
                   created_at: sale.created_at
                 });
                 return false;
               }
               
               const matches = saleDate.getMonth() === date.getMonth() && 
                      saleDate.getFullYear() === date.getFullYear();
               
               console.log(`Sale ${sale.id} date check:`, {
                 rawDate: sale.expected_close_date || sale.updated_at || sale.created_at,
                 parsedDate: saleDate.toISOString(),
                 targetMonth: date.getMonth(),
                 targetYear: date.getFullYear(),
                 saleMonth: saleDate.getMonth(),
                 saleYear: saleDate.getFullYear(),
                 monthNames: {
                   target: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                   sale: saleDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                 },
                 matches
               });
               
               return matches;
             })
             .reduce((sum, sale) => {
               const amount = parseFloat(sale.amount) || 0;
               console.log(`Adding sale ${sale.id} amount:`, amount);
               return sum + amount;
             }, 0);
           
           console.log(`${monthName} total revenue:`, monthRevenue);
           
           months.push({
             month: monthName,
             revenue: monthRevenue,
             target: monthRevenue * 1.2, // Simple target calculation
           });
         }
         
         console.log('Final revenue data:', months);
         setRevenueData(months);
         setLoading(false);
       };

       if (!dashboardData.loading) {
         generateRevenueData();
       }
     }, [dashboardData, timeRange]);

    const totalRevenue = revenueData.reduce((sum, month) => sum + month.revenue, 0);
    const avgMonthlyRevenue = totalRevenue / (revenueData.length || 1);

    return (
      <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Revenue Analytics
              </Typography>
            </Box>
          }
          action={
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="12months">Last 12 Months</MenuItem>
              </Select>
            </FormControl>
          }
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Summary Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatCurrency(totalRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatCurrency(avgMonthlyRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg Monthly
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

                             {/* Simple Bar Chart */}
               <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1, px: 1 }}>
                 {revenueData.length > 0 ? revenueData.map((month, index) => {
                   const maxRevenue = Math.max(...revenueData.map(m => m.revenue));
                   const height = maxRevenue > 0 ? Math.max((month.revenue / maxRevenue) * 150, 8) : 8;
                   
                   return (
                     <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <Tooltip title={`${month.month}: ${formatCurrency(month.revenue)}`}>
                         <Box
                           sx={{
                             width: '100%',
                             height: `${height}px`,
                             bgcolor: month.revenue > 0 ? 'primary.main' : 'grey.300',
                             borderRadius: '4px 4px 0 0',
                             transition: 'all 0.3s ease',
                             cursor: 'pointer',
                             '&:hover': {
                               bgcolor: month.revenue > 0 ? 'primary.dark' : 'grey.400',
                               transform: 'translateY(-2px)',
                             }
                           }}
                         />
                       </Tooltip>
                       <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontSize: '0.7rem' }}>
                         {month.month.split(' ')[0]}
                       </Typography>
                     </Box>
                   );
                 }) : (
                   <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                     <Typography color="text.secondary">No data available</Typography>
                   </Box>
                 )}
               </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Top Sales Opportunities Component
  const TopSalesOpportunitiesCard = () => {
    const topOpportunities = dashboardData.recentSales
      .filter(sale => sale.status && !['WON', 'LOST'].includes(sale.status))
      .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
      .slice(0, 5);

    const getStatusColor = (status) => {
      switch (status) {
        case 'NEW': return 'info';
        case 'CONTACTED': return 'primary';
        case 'PROPOSAL': return 'warning';
        case 'NEGOTIATION': return 'secondary';
        default: return 'default';
      }
    };

    const getStatusDisplay = (status) => {
      switch (status) {
        case 'NEW': return 'New';
        case 'CONTACTED': return 'Contacted';
        case 'PROPOSAL': return 'Proposal';
        case 'NEGOTIATION': return 'Negotiation';
        default: return status;
      }
    };

    return (
      <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SalesIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Top Sales Opportunities
              </Typography>
            </Box>
          }
          action={
            <Button
              component={Link}
              to="/sales"
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {dashboardData.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : topOpportunities.length > 0 ? (
            <List sx={{ p: 0 }}>
              {topOpportunities.map((sale, index) => (
                <ListItem
                  key={sale.id}
                  sx={{
                    px: 0,
                    py: 1.5,
                    borderBottom: index < topOpportunities.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                  onClick={() => navigate(`/sales/${sale.id}`)}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {sale.title || 'Untitled Opportunity'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {sale.customer_name || 'Unknown Customer'}
                        </Typography>
                        <Chip
                          label={getStatusDisplay(sale.status)}
                          color={getStatusColor(sale.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {sale.priority && (
                          <Chip
                            label={sale.priority_display || sale.priority}
                            color={sale.priority === 'HIGH' ? 'error' : sale.priority === 'LOW' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(parseFloat(sale.amount) || 0)}
                        </Typography>
                        {sale.expected_close_date && (
                          <Typography variant="caption" color="text.secondary">
                            Expected: {formatDate(sale.expected_close_date)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Progress bar based on status */}
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={
                          sale.status === 'NEW' ? 20 :
                          sale.status === 'CONTACTED' ? 40 :
                          sale.status === 'PROPOSAL' ? 60 :
                          sale.status === 'NEGOTIATION' ? 80 : 0
                        }
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 2,
                            bgcolor: 
                              sale.status === 'NEW' ? 'info.main' :
                              sale.status === 'CONTACTED' ? 'primary.main' :
                              sale.status === 'PROPOSAL' ? 'warning.main' :
                              sale.status === 'NEGOTIATION' ? 'secondary.main' : 'grey.400'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SalesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No sales opportunities found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (dashboardData.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

        // Calculate real dashboard metrics from the actual data
      // Note: Backend already filters data based on user role (USER sees only their data, MANAGER/ADMIN see all)
      const totalCustomers = dashboardData.customers.length || 0;
      
      // Calculate pipeline value from sales data (excluding WON and LOST)
      const pipelineValue = dashboardData.recentSales
        .filter(sale => sale.status && !['WON', 'LOST'].includes(sale.status))
        .reduce((total, sale) => total + (parseFloat(sale.amount) || 0), 0);
      
      // Calculate active tasks (pending and in progress)
      const activeTasks = dashboardData.tasks
        .filter(task => task.status && ['P', 'IP'].includes(task.status)).length || 0;
      
      // Calculate upcoming events (today + next 3 days)
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      const upcomingEvents = dashboardData.events
        .filter(event => {
          if (!event.start_time) return false;
          const eventDate = new Date(event.start_time);
          return eventDate >= today && eventDate <= threeDaysFromNow;
        }).length || 0;
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs 
          aria-label="breadcrumb"
          separator={<NavigateNextIcon fontSize="small" />}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon fontSize="small" />
            <Typography color="text.primary" sx={{ fontWeight: 'medium' }}>
              Dashboard
      </Typography>
          </Box>
        </Breadcrumbs>
      </Box>
      
      {/* KPI Cards - Now using real data from tabs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Customers"
            value={formatLargeNumber(totalCustomers)}
            icon={<PeopleIcon />}
            color="primary"
            trend={false}
            period="All Customers"
            link="/customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pipeline Value"
            value={formatCurrency(pipelineValue)}
            icon={<SalesIcon />}
            color="success"
            trend={false}
            period="Active Opportunities"
            link="/sales"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Tasks"
            value={formatLargeNumber(activeTasks)}
            icon={<TaskIcon />}
            color="warning"
            trend={false}
            period="Pending & In Progress"
            link="/tasks"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Upcoming Events"
            value={formatLargeNumber(upcomingEvents)}
            icon={<CalendarIcon />}
            color="info"
            trend={false}
            period="Next 3 Days"
            link="/calendar"
          />
        </Grid>
      </Grid>

      {/* Revenue Analytics & Sales Opportunities */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <RevenueAnalyticsCard />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TopSalesOpportunitiesCard />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 