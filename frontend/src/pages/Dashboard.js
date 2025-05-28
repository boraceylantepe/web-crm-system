import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as SalesIcon,
  Task as TaskIcon,
  Event as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { getCustomers } from '../services/customerService';
import { getSalesPipeline, getSalesStats, getSales } from '../services/saleService';
import taskService from '../services/taskService';
import calendarService from '../services/calendarService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { LineChart, MetricCard } from '../components/charts/ChartComponents';
import reportingService from '../services/reportingService';

const StatWidget = ({ title, value, icon, color, link }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.1,
          transform: 'rotate(10deg)',
          fontSize: '8rem'
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" component="div" sx={{ color }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          component={Link}
          to={link}
          variant="outlined"
          size="small"
          sx={{ color, borderColor: color }}
        >
          View Details
        </Button>
      </Box>
    </Paper>
  );
};

const RecentItemsList = ({ title, items, loading, emptyMessage, link, renderItem, icon, color }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '300px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 1, color }}>{icon}</Box>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length > 0 ? (
        <List sx={{ flex: 1, overflowY: 'auto' }}>
          {items.map(renderItem)}
        </List>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button component={Link} to={link} variant="text" sx={{ color }}>
          View All
        </Button>
      </Box>
    </Paper>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    customers: 0,
    sales: 0,
    tasks: 0,
    events: 0
  });
  
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [salesPipeline, setSalesPipeline] = useState({});
  const [salesStats, setSalesStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState(null);
  
  const [loading, setLoading] = useState({
    stats: true,
    tasks: true,
    sales: true,
    events: true,
    pipeline: true,
    analytics: true
  });
  
  const { user } = useContext(AuthContext);
  
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
  
  // Helper functions for task status and priority
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'P': return 'Pending';
      case 'IP': return 'In Progress';
      case 'C': return 'Completed';
      case 'O': return 'Overdue';
      default: return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'P': return 'warning';
      case 'IP': return 'primary';
      case 'C': return 'success';
      case 'O': return 'error';
      default: return 'default';
    }
  };
  
  const getPriorityDisplay = (priority) => {
    switch(priority) {
      case 'L': return 'Low';
      case 'M': return 'Medium';
      case 'H': return 'High';
      default: return priority;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'L': return 'success';
      case 'M': return 'warning';
      case 'H': return 'error';
      default: return 'default';
    }
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch customers
        const customersData = await getCustomers();
        const customersCount = Array.isArray(customersData.results) 
          ? customersData.results.length 
          : (customersData.count || 0);
        
        // 2. Fetch sales pipeline and stats
        const pipelineData = await getSalesPipeline();
        setSalesPipeline(pipelineData);
        setLoading(prev => ({ ...prev, pipeline: false }));
        
        const statsData = await getSalesStats();
        setSalesStats(statsData);
        
        // 3. Calculate total opportunities
        const totalSales = Object.values(pipelineData || {}).reduce(
          (total, status) => total + (Array.isArray(status) ? status.length : 0), 
          0
        );
        
        // 4. Get recent sales
        const salesData = await getSales({ limit: 3, ordering: '-updated_at' });
        const recentSalesData = Array.isArray(salesData.results) 
          ? salesData.results 
          : [];
        
        setRecentSales(recentSalesData);
        setLoading(prev => ({ ...prev, sales: false }));
        
        // 5. Fetch task statistics
        const taskStatsData = await taskService.getTaskStats();
        
        // 6. Fetch actual tasks data
        const recentTasksData = await taskService.getUpcomingTasks(3);
        setRecentTasks(recentTasksData);
        setLoading(prev => ({ ...prev, tasks: false }));
        
        // 7. Fetch upcoming events data
        const upcomingEventsData = await calendarService.getUpcomingEvents(3);
        setUpcomingEvents(upcomingEventsData);
        setLoading(prev => ({ ...prev, events: false }));
        
        // 8. Update stats with actual counts
        setStats({
          customers: customersCount,
          sales: totalSales,
          tasks: taskStatsData.active_tasks || 0,
          events: upcomingEventsData.length || 0
        });
        setLoading(prev => ({ ...prev, stats: false }));
        
        // 9. Load basic analytics data for the widget
        try {
          const dashboardKPIs = await reportingService.analytics.getDashboardKPIs();
          setAnalyticsData(dashboardKPIs.data);
          setLoading(prev => ({ ...prev, analytics: false }));
        } catch (error) {
          console.error('Error loading analytics:', error);
          setLoading(prev => ({ ...prev, analytics: false }));
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set loading states to false on error
        setLoading({
          stats: false,
          tasks: false,
          sales: false,
          events: false,
          pipeline: false,
          analytics: false
        });
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.first_name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Here's what's happening with your CRM today.
      </Typography>
      
      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatWidget
            title="Total Customers"
            value={loading.stats ? <CircularProgress size={24} /> : stats.customers}
            icon={<PeopleIcon />}
            color="primary.main"
            link="/customers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatWidget
            title="Active Sales"
            value={loading.sales ? <CircularProgress size={24} /> : stats.sales}
            icon={<SalesIcon />}
            color="success.main"
            link="/sales"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatWidget
            title="Open Tasks"
            value={loading.tasks ? <CircularProgress size={24} /> : stats.tasks}
            icon={<TaskIcon />}
            color="warning.main"
            link="/tasks"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatWidget
            title="Upcoming Events"
            value={loading.events ? <CircularProgress size={24} /> : stats.events}
            icon={<CalendarIcon />}
            color="info.main"
            link="/calendar"
          />
        </Grid>
      </Grid>

      {/* Analytics Widget */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Quick Analytics
              </Typography>
              <Button 
                component={Link} 
                to="/analytics" 
                variant="outlined" 
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                View Full Analytics
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading.analytics ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : analyticsData ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Sales This Month"
                    value={formatCurrency(analyticsData.sales?.current_month_amount || 0)}
                    subtitle="Current month performance"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="New Customers"
                    value={analyticsData.customers?.new_customers || 0}
                    subtitle="This month"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Task Completion"
                    value={`${(analyticsData.tasks?.completion_rate || 0).toFixed(1)}%`}
                    subtitle="Current rate"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <MetricCard
                    title="Active Customers"
                    value={analyticsData.customers?.active_customers || 0}
                    subtitle="Total active"
                  />
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Analytics data not available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Activities Grid */}
      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid item xs={12} md={4}>
          <RecentItemsList
            title="Recent Tasks"
            items={recentTasks}
            loading={loading.tasks}
            emptyMessage="No recent tasks"
            link="/tasks"
            icon={<TaskIcon />}
            color="warning.main"
            renderItem={(task, index) => (
              <ListItem key={task.id || index} disablePadding>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" noWrap>
                        {task.title}
                      </Typography>
                      <Chip
                        label={getStatusDisplay(task.status)}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Due: {formatDate(task.due_date)}
                      </Typography>
                      <Chip
                        label={getPriorityDisplay(task.priority)}
                        color={getPriorityColor(task.priority)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            )}
          />
        </Grid>
        
        {/* Recent Sales */}
        <Grid item xs={12} md={4}>
          <RecentItemsList
            title="Recent Sales"
            items={recentSales}
            loading={loading.sales}
            emptyMessage="No recent sales"
            link="/sales"
            icon={<SalesIcon />}
            color="success.main"
            renderItem={(sale, index) => (
              <ListItem key={sale.id || index} disablePadding>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" noWrap>
                        {sale.customer?.company_name || sale.customer?.first_name + ' ' + sale.customer?.last_name}
                      </Typography>
                      <Chip
                        label={statusDisplay[sale.status] || sale.status}
                        color={statusColors[sale.status] || 'default'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Value: {formatCurrency(sale.amount)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Updated: {formatDate(sale.updated_at)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )}
          />
        </Grid>
        
        {/* Upcoming Events */}
        <Grid item xs={12} md={4}>
          <RecentItemsList
            title="Upcoming Events"
            items={upcomingEvents}
            loading={loading.events}
            emptyMessage="No upcoming events"
            link="/calendar"
            icon={<CalendarIcon />}
            color="info.main"
            renderItem={(event, index) => (
              <ListItem key={event.id || index} disablePadding>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap>
                      {event.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        <TimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {formatDateTime(event.start_time)}
                      </Typography>
                      {event.description && (
                        <Typography variant="caption" display="block" noWrap>
                          {event.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 