import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Stack,
  Tab,
  Tabs,
  Fade,
  useTheme,
  alpha,
  Snackbar
} from '@mui/material';
import {
  TrendingUp,
  Analytics as AnalyticsIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Download,
  Refresh,
  FilterList,
  People,
  AttachMoney,
  Assignment,
  Insights,
  Dashboard as DashboardIcon,
  Timeline,
  DateRange
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import reportingService from '../services/reportingService';

// Enhanced Chart Components
import {
  LineChart,
  BarChart,
  DonutChart,
  MetricCard,
  AreaChart,
  ComboChart,
  UserSalesTable,
  UserTasksTable
} from '../components/charts/ChartComponents';

// Constants
const TIME_PERIODS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' }
];

const CHART_COLORS = [
  '#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', 
  '#d32f2f', '#7b1fa2', '#303f9f', '#388e3c', '#f57c00'
];

// Utility Functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatNumber = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value?.toString() || '0';
};



// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Loading Skeleton Component
const ChartSkeleton = ({ height = 300 }) => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height} />
  </Box>
);

// Enhanced KPI Cards Component
const KPICards = ({ data, loading }) => {
  const theme = useTheme();

  const kpis = [
    {
      title: 'Total Sales',
      value: formatCurrency(data?.sales?.total_amount || 0),
      subtitle: `${data?.sales?.total_sales || 0} deals`,
      icon: <AttachMoney />,
      color: 'success'
    },
    {
      title: 'Active Customers',
      value: formatNumber(data?.customers?.total_customers || 0),
      subtitle: `${data?.customers?.new_this_month || 0} new this month`,
      icon: <People />,
      color: 'primary'
    },
    {
      title: 'Completed Tasks',
      value: formatNumber(data?.tasks?.completed_tasks || 0),
      subtitle: `${Math.round(data?.tasks?.completion_rate || 0)}% completion rate`,
      icon: <Assignment />,
      color: 'info'
    },
    {
      title: 'Conversion Rate',
      value: `${Math.round(data?.sales?.win_rate || 0)}%`,
      subtitle: `${data?.sales?.won_sales || 0} won deals`,
      icon: <TrendingUp />,
      color: 'warning'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {kpis.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Fade in timeout={300 + index * 100}>
            <div>
              <MetricCard
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                icon={kpi.icon}
                color={kpi.color}
                background
              />
            </div>
          </Fade>
        </Grid>
      ))}
    </Grid>
  );
};

// Sales Overview Component
const SalesOverview = ({ data, loading, timePeriod }) => {
  const chartData = useMemo(() => {
    if (!data?.sales_over_time) return [];
    
    return data.sales_over_time.map(item => ({
      name: new Date(item.period).toLocaleDateString('en-US', {
        month: 'short',
        day: timePeriod === 'day' ? 'numeric' : undefined,
        year: timePeriod === 'month' ? 'numeric' : undefined
      }),
      revenue: item.total_amount || 0,
      deals: item.count || 0
    }));
  }, [data?.sales_over_time, timePeriod]);

  if (loading) {
    return <ChartSkeleton height={350} />;
  }

  return (
    <ComboChart
      data={chartData}
      title="Sales Performance Over Time"
      height={350}
      barDataKey="revenue"
      lineDataKey="deals"
      barName="Revenue"
      lineName="Number of Deals"
      barColor={CHART_COLORS[0]}
      lineColor={CHART_COLORS[1]}
      formatBar={(value) => `$${(value / 1000).toFixed(0)}K`}
      formatLine={(value) => value}
      leftAxisLabel="Revenue (Thousands)"
      rightAxisLabel="Number of Deals"
    />
  );
};

// Customer Insights Component
const CustomerInsights = ({ data, loading }) => {
  const statusData = useMemo(() => {
    if (!data?.customer_status) return [];
    
    return data.customer_status.map((item, index) => ({
      name: item.status?.replace('_', ' ') || 'Unknown',
      value: item.count || 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [data?.customer_status]);

  const engagementData = useMemo(() => {
    if (!data?.engagement_levels) return [];
    
    return data.engagement_levels.map(item => ({
      name: item.engagement_level?.replace('_', ' ') || 'Unknown',
      value: item.count || 0
    }));
  }, [data?.engagement_levels]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartSkeleton height={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartSkeleton height={300} />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <DonutChart
          data={statusData}
          title="Customer Status Distribution"
          height={300}
          colors={CHART_COLORS}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <BarChart
          data={engagementData}
          title="Customer Engagement Levels"
          height={300}
          bars={[{ dataKey: 'value', name: 'Customers' }]}
          colors={[CHART_COLORS[2]]}
        />
      </Grid>
    </Grid>
  );
};



// Filters Component
const AnalyticsFilters = ({ filters, onFiltersChange, onRefresh, loading }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          Filters & Controls
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Fade in>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filters.timePeriod}
                  label="Time Period"
                  onChange={(e) => onFiltersChange({ ...filters, timePeriod: e.target.value })}
                >
                  {TIME_PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onFiltersChange({
                  timePeriod: 'month',
                  startDate: '',
                  endDate: ''
                })}
                sx={{ height: 56 }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Fade>
      )}
    </Paper>
  );
};

// Main Analytics Component
const Analytics = () => {
  const { user, isAdminOrManager } = useContext(AuthContext);
  const theme = useTheme();
  
  console.log('Analytics - user:', user, 'isAdminOrManager:', isAdminOrManager);
  
  // State Management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [userSalesData, setUserSalesData] = useState(null);
  const [userTasksData, setUserTasksData] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState({
    timePeriod: 'month',
    startDate: '',
    endDate: ''
  });

  // Load Data
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      
      const params = {
        grouping: filters.timePeriod,
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(!isAdminOrManager && user?.id && { user_id: user.id }),
        _t: timestamp // Cache-busting parameter
      };

      // Load core analytics data
      const [kpiResponse, salesResponse, customerResponse] = await Promise.all([
        reportingService.analytics.getDashboardKPIs(params),
        reportingService.analytics.getSalesPerformance(params),
        reportingService.analytics.getCustomerEngagement(params)
      ]);

      setKpiData(kpiResponse.data);
      setSalesData(salesResponse.data);
      setCustomerData(customerResponse.data);

      // Load user performance data for managers and admins
      if (isAdminOrManager) {
        console.log('Loading user performance data for admin/manager...');
        const [userSalesResponse, userTasksResponse] = await Promise.all([
          reportingService.analytics.getUserSalesPerformance(params),
          reportingService.analytics.getUserTaskPerformance(params)
        ]);

        console.log('User sales response:', userSalesResponse);
        console.log('User tasks response:', userTasksResponse);

        setUserSalesData(userSalesResponse.data);
        setUserTasksData(userTasksResponse.data);
        
        console.log('User sales data set:', userSalesResponse.data);
        console.log('User tasks data set:', userTasksResponse.data);
      }
      
      return true; // Return success
    } catch (err) {
      console.error('Analytics data loading error:', err);
      setError('Failed to load analytics data. Please try again.');
      throw err; // Re-throw to handle in refresh
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  // Handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    console.log('Refreshing analytics data...'); // Debug log
    loadAnalyticsData()
      .then(() => {
        setRefreshSuccess(true); // Show success notification after refresh
      })
      .catch(() => {
        // Error is already handled in loadAnalyticsData
        console.log('Refresh failed');
      });
  };

  const handleExport = async () => {
    try {
      const data = {
        kpi: kpiData,
        sales: salesData,
        customers: customerData
      };
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.entries(data).map(([key, value]) => 
          `${key},${JSON.stringify(value)}`
        ).join('\n');
      
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Tab configuration
  const tabs = [
    { label: 'Overview', icon: <DashboardIcon /> },
    { label: 'Sales', icon: <AttachMoney /> },
    { label: 'Customers', icon: <People /> }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AnalyticsIcon />
          </Avatar>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive insights and performance metrics for your CRM data
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* KPI Cards */}
      <KPICards data={kpiData} loading={loading} />

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ px: 2 }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SalesOverview data={salesData} loading={loading} timePeriod={filters.timePeriod} />
            </Grid>
            <Grid item xs={12}>
              <CustomerInsights data={customerData} loading={loading} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SalesOverview data={salesData} loading={loading} timePeriod={filters.timePeriod} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CustomerInsights data={customerData} loading={loading} />
        </TabPanel>


      </Paper>

      {/* User Performance Tables - Only for Managers and Admins */}
      {isAdminOrManager && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <People />
              User Performance Overview
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <UserSalesTable data={userSalesData} loading={loading} />
          </Grid>
          <Grid item xs={12} md={6}>
            <UserTasksTable data={userTasksData} loading={loading} />
          </Grid>
        </Grid>
      )}

      {/* Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
          disabled={loading}
          size="large"
        >
          Export Data
        </Button>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={refreshSuccess}
        autoHideDuration={3000}
        onClose={() => setRefreshSuccess(false)}
        message="Analytics data refreshed successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};

export default Analytics; 