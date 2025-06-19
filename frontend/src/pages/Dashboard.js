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

  const customerColumns = [
    { id: 'customer', label: 'Customer' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'created_at', label: 'Created Date' },
    { id: 'status', label: 'Status' },
  ];

  const renderCustomerRow = (customer, index) => (
    <>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
            {customer.name?.charAt(0) || customer.first_name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {customer.name || `${customer.first_name} ${customer.last_name}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Customer ID #{customer.id}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.phone || 'N/A'}</TableCell>
      <TableCell>{formatDate(customer.created_at)}</TableCell>
      <TableCell>
        <Chip 
          label={customer.is_active ? 'Active' : 'Inactive'} 
          color={customer.is_active ? 'success' : 'default'}
          size="small"
        />
      </TableCell>
    </>
  );

  const taskColumns = [
    { id: 'task', label: 'Task' },
    { id: 'assigned_to', label: 'Assigned To' },
    { id: 'due_date', label: 'Due Date' },
    { id: 'priority', label: 'Priority' },
    { id: 'status', label: 'Status' },
  ];

  const renderTaskRow = (task, index) => (
    <>
      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            #{task.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {task.title}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>{task.assigned_to_name || 'Unassigned'}</TableCell>
      <TableCell>{task.due_date ? formatDate(task.due_date) : 'No due date'}</TableCell>
      <TableCell>
        <Chip 
          label={getPriorityDisplay(task.priority)} 
          color={getPriorityColor(task.priority)}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Chip 
          label={getStatusDisplay(task.status)} 
          color={getStatusColor(task.status)}
          size="small"
        />
      </TableCell>
    </>
  );

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

      {/* Data Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <DataTableCard
            title="Top Customers"
            data={dashboardData.customers}
            loading={dashboardData.loading}
            emptyMessage="No customers found"
            icon={<PeopleIcon />}
            color="primary"
            columns={customerColumns}
            renderRow={renderCustomerRow}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <DataTableCard
            title="Recent Tasks"
            data={dashboardData.tasks}
            loading={dashboardData.loading}
            emptyMessage="No tasks found"
            icon={<TaskIcon />}
            color="secondary"
            columns={taskColumns}
            renderRow={renderTaskRow}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 