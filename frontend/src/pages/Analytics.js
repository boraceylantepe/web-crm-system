import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Collapse,
  IconButton,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  BarChart, 
  DonutChart, 
  MetricCard, 
  ProgressChart,
  AreaChart
} from '../components/charts/ChartComponents';
import { AuthContext } from '../context/AuthContext';
import reportingService from '../services/reportingService';

// Utility functions for chart data formatting (recreated from removed chartUtils)
const chartUtils = {
  formatCurrency: (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  },
  
  formatLargeNumber: (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  },
  
  calculateChange: (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }
};

// Simple DataTable component to replace the missing one
const DataTable = ({ data, columns, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: height }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                {column.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key] || '-'
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Analytics = () => {
  const { user, isAdminOrManager } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  
  // Filter states
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [grouping, setGrouping] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadAnalyticsData();
    }
  }, [dateRange, grouping]);

  const loadDashboardData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      
      const dashboardResponse = await reportingService.analytics.getDashboardKPIs();
      setDashboardData(dashboardResponse.data);
      
      // Load initial analytics data without date range
      await loadAnalyticsData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      if (!refreshing) {
        setLoading(false);
      }
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const params = {
        grouping,
        ...(dateRange.startDate && dateRange.endDate && {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        // For regular users, add user_id to filter only their data
        ...(!isAdminOrManager && user?.id && {
          user_id: user.id
        })
      };

      const [salesResponse, customerResponse, taskResponse, conversionResponse] = await Promise.all([
        reportingService.analytics.getSalesPerformance(params),
        reportingService.analytics.getCustomerEngagement(params),
        reportingService.analytics.getTaskCompletion(params),
        reportingService.analytics.getConversionRatios(params)
      ]);

      setSalesData(salesResponse.data);
      setCustomerData(customerResponse.data);
      setTaskData(taskResponse.data);
      setConversionData(conversionResponse.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Clear cache first (optional, don't fail if it doesn't work)
      try {
        await reportingService.analytics.clearCache();
      } catch (cacheError) {
        console.warn('Cache clearing failed, but continuing with refresh:', cacheError);
        // Don't block the refresh if cache clearing fails
      }
      
      // Reload dashboard data
      await loadDashboardData();
      setSuccessMessage('Analytics data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Check if we have data to export
      if (!dashboardData && !salesData && !customerData && !taskData) {
        setError('No data available to export. Please refresh the dashboard first.');
        return;
      }
      
      // Collect all current analytics data
      const exportData = {
        dashboard_kpis: dashboardData,
        sales_performance: salesData,
        customer_engagement: customerData,
        task_completion: taskData,
        conversion_ratios: conversionData,
        filters: {
          date_range: dateRange,
          grouping: grouping
        },
        exported_at: new Date().toISOString(),
        exported_by: user?.username || 'Unknown'
      };

      // Convert to CSV format
      const csvContent = generateCSVContent(exportData);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      setSuccessMessage(`Analytics data exported successfully as ${filename}!`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const generateCSVContent = (data) => {
    const sections = [];
    
    // Helper function to convert object to CSV rows
    const objectToCSV = (obj, title) => {
      const rows = [`"${title}"`];
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          rows.push(`"${key}","${JSON.stringify(value)}"`);
        } else {
          rows.push(`"${key}","${value}"`);
        }
      });
      return rows.join('\n');
    };

    // Add dashboard KPIs
    if (data.dashboard_kpis) {
      sections.push(objectToCSV(data.dashboard_kpis, 'Dashboard KPIs'));
    }

    // Add sales performance
    if (data.sales_performance) {
      sections.push(objectToCSV(data.sales_performance, 'Sales Performance'));
    }

    // Add customer engagement
    if (data.customer_engagement) {
      sections.push(objectToCSV(data.customer_engagement, 'Customer Engagement'));
    }

    // Add task completion
    if (data.task_completion) {
      sections.push(objectToCSV(data.task_completion, 'Task Completion'));
    }

    // Add conversion ratios
    if (data.conversion_ratios) {
      sections.push(objectToCSV(data.conversion_ratios, 'Conversion Ratios'));
    }

    // Add metadata
    sections.push(`\n"Export Information"`);
    sections.push(`"Exported At","${data.exported_at}"`);
    sections.push(`"Exported By","${data.exported_by}"`);
    sections.push(`"Date Range","${data.filters.date_range.startDate} to ${data.filters.date_range.endDate}"`);
    sections.push(`"Grouping","${data.filters.grouping}"`);

    return sections.join('\n\n');
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
    setGrouping('month');
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View performance metrics and insights for your CRM data
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </Box>
        </Box>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterExpanded(!filterExpanded)}
              sx={{ ml: 'auto' }}
            >
              {filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={filterExpanded}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Group By</InputLabel>
                  <Select
                    value={grouping}
                    label="Group By"
                    onChange={(e) => setGrouping(e.target.value)}
                  >
                    <MenuItem value="day">Day</MenuItem>
                    <MenuItem value="week">Week</MenuItem>
                    <MenuItem value="month">Month</MenuItem>
                    <MenuItem value="quarter">Quarter</MenuItem>
                    <MenuItem value="year">Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Dashboard KPIs */}
        {dashboardData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Sales"
                value={chartUtils.formatCurrency(dashboardData.total_sales_amount || 0)}
                icon={<TrendingUpIcon />}
                color="primary"
                trend={dashboardData.sales_change !== undefined}
                trendValue={`${chartUtils.calculateChange(
                  dashboardData.total_sales_amount || 0,
                  dashboardData.previous_sales_amount || 0
                )}%`}
                trendDirection={
                  (dashboardData.total_sales_amount || 0) >= (dashboardData.previous_sales_amount || 0) 
                    ? 'up' : 'down'
                }
                subtitle="This period"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Customers"
                value={chartUtils.formatLargeNumber(dashboardData.total_customers || 0)}
                icon={<AssessmentIcon />}
                color="success"
                trend={dashboardData.customer_change !== undefined}
                trendValue={`${chartUtils.calculateChange(
                  dashboardData.total_customers || 0,
                  dashboardData.previous_customers || 0
                )}%`}
                trendDirection={
                  (dashboardData.total_customers || 0) >= (dashboardData.previous_customers || 0) 
                    ? 'up' : 'down'
                }
                subtitle="Active customers"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Deal Size"
                value={chartUtils.formatCurrency(dashboardData.avg_deal_size || 0)}
                icon={<TrendingUpIcon />}
                color="warning"
                trend={dashboardData.deal_size_change !== undefined}
                trendValue={`${chartUtils.calculateChange(
                  dashboardData.avg_deal_size || 0,
                  dashboardData.previous_avg_deal_size || 0
                )}%`}
                trendDirection={
                  (dashboardData.avg_deal_size || 0) >= (dashboardData.previous_avg_deal_size || 0) 
                    ? 'up' : 'down'
                }
                subtitle="Per sale"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Conversion Rate"
                value={`${(dashboardData.conversion_rate || 0).toFixed(1)}%`}
                icon={<AssessmentIcon />}
                color="info"
                trend={dashboardData.conversion_change !== undefined}
                trendValue={`${chartUtils.calculateChange(
                  dashboardData.conversion_rate || 0,
                  dashboardData.previous_conversion_rate || 0
                )}%`}
                trendDirection={
                  (dashboardData.conversion_rate || 0) >= (dashboardData.previous_conversion_rate || 0) 
                    ? 'up' : 'down'
                }
                subtitle="Lead to customer"
              />
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        {salesData && salesData.time_series && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <LineChart
                title="Sales Performance Over Time"
                data={salesData.time_series.map(item => ({
                  name: item.period,
                  value: item.total_amount || 0,
                  count: item.total_sales || 0
                }))}
                lines={[
                  { dataKey: 'value', name: 'Amount' },
                  { dataKey: 'count', name: 'Count' }
                ]}
                colors={['#1976d2', '#dc004e']}
                height={350}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <BarChart
                title="Monthly Sales Comparison"
                data={salesData.time_series.slice(-6).map(item => ({
                  name: item.period,
                  value: item.total_amount || 0
                }))}
                bars={[{ dataKey: 'value', name: 'Sales Amount' }]}
                colors={['#1976d2']}
                height={350}
              />
            </Grid>
          </Grid>
        )}

        {/* Customer Engagement & Task Progress */}
        {(customerData || taskData) && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {customerData && customerData.engagement_distribution && (
              <Grid item xs={12} md={6}>
                <DonutChart
                  title="Customer Engagement Distribution"
                  data={customerData.engagement_distribution.map(item => ({
                    name: item.engagement_level,
                    value: item.count
                  }))}
                  colors={['#1976d2', '#dc004e', '#ed6c02', '#2e7d32']}
                  height={350}
                  centerText="Total"
                  centerValue={customerData.engagement_distribution.reduce((sum, item) => sum + item.count, 0)}
                />
              </Grid>
            )}

            {taskData && taskData.completion_progress && (
              <Grid item xs={12} md={6}>
                <ProgressChart
                  title="Task Completion Progress"
                  value={taskData.completion_progress.completed_tasks || 0}
                  total={taskData.completion_progress.total_tasks || 1}
                  color="success"
                  subtitle={`${((taskData.completion_progress.completed_tasks || 0) / (taskData.completion_progress.total_tasks || 1) * 100).toFixed(1)}% Complete`}
                />
              </Grid>
            )}
          </Grid>
        )}

        {/* Data Tables */}
        <Grid container spacing={3}>
          {/* Top Sales Performers - Only visible to Admins/Managers */}
          {isAdminOrManager && salesData && salesData.top_performers && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Sales Performers
                </Typography>
                <DataTable
                  data={salesData.top_performers}
                  columns={[
                    { 
                      title: 'Name', 
                      key: 'assigned_to__first_name',
                      render: (value, row) => 
                        `${row.assigned_to__first_name || ''} ${row.assigned_to__last_name || ''}`.trim() || row.assigned_to__username
                    },
                    { title: 'Total Sales', key: 'total_sales' },
                    { 
                      title: 'Amount', 
                      key: 'total_amount',
                      render: (value) => chartUtils.formatCurrency(value || 0)
                    },
                    { title: 'Won Sales', key: 'won_sales' }
                  ]}
                  height={300}
                />
              </Paper>
            </Grid>
          )}
          
          {/* Task Performance by User - Only visible to Admins/Managers */}
          {isAdminOrManager && taskData && taskData.user_performance && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Task Performance by User
                </Typography>
                <DataTable
                  data={taskData.user_performance}
                  columns={[
                    { 
                      title: 'Name', 
                      key: 'assigned_to__first_name',
                      render: (value, row) => 
                        `${row.assigned_to__first_name || ''} ${row.assigned_to__last_name || ''}`.trim() || row.assigned_to__username
                    },
                    { title: 'Total Tasks', key: 'total_tasks' },
                    { title: 'Completed', key: 'completed_tasks' },
                    { 
                      title: 'Completion Rate', 
                      key: 'completion_rate',
                      render: (value) => `${value?.toFixed(1) || 0}%`
                    }
                  ]}
                  height={300}
                />
              </Paper>
            </Grid>
          )}

          {/* Personal Performance - Only visible to Regular Users */}
          {!isAdminOrManager && (
            <>
              {/* Personal Sales Performance */}
              {salesData && salesData.personal_performance && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      My Sales Performance
                    </Typography>
                    <DataTable
                      data={[salesData.personal_performance]}
                      columns={[
                        { title: 'Total Sales', key: 'total_sales' },
                        { 
                          title: 'Amount', 
                          key: 'total_amount',
                          render: (value) => chartUtils.formatCurrency(value || 0)
                        },
                        { title: 'Won Sales', key: 'won_sales' },
                        { 
                          title: 'Win Rate', 
                          key: 'win_rate',
                          render: (value) => `${value?.toFixed(1) || 0}%`
                        }
                      ]}
                      height={300}
                    />
                  </Paper>
                </Grid>
              )}

              {/* Personal Task Performance */}
              {taskData && taskData.personal_performance && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      My Task Performance
                    </Typography>
                    <DataTable
                      data={[taskData.personal_performance]}
                      columns={[
                        { title: 'Total Tasks', key: 'total_tasks' },
                        { title: 'Completed', key: 'completed_tasks' },
                        { title: 'Pending', key: 'pending_tasks' },
                        { 
                          title: 'Completion Rate', 
                          key: 'completion_rate',
                          render: (value) => `${value?.toFixed(1) || 0}%`
                        }
                      ]}
                      height={300}
                    />
                  </Paper>
                </Grid>
              )}
            </>
          )}
        </Grid>

        {/* Conversion Metrics */}
        {conversionData && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conversion Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Sales Conversion
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Opportunities:</Typography>
                          <Chip label={conversionData.sales_conversion?.total_opportunities || 0} />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Won:</Typography>
                          <Chip label={conversionData.sales_conversion?.won_opportunities || 0} color="success" />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Lost:</Typography>
                          <Chip label={conversionData.sales_conversion?.lost_opportunities || 0} color="error" />
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="bold">Win Rate:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {(conversionData.sales_conversion?.win_rate || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Customer Conversion
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Leads:</Typography>
                          <Chip label={conversionData.customer_conversion?.total_leads || 0} />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Converted:</Typography>
                          <Chip label={conversionData.customer_conversion?.converted_customers || 0} color="success" />
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="bold">Conversion Rate:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {(conversionData.customer_conversion?.conversion_rate || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Analytics; 