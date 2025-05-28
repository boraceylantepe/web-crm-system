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
  Chip
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
  PieChart, 
  DoughnutChart, 
  MetricCard, 
  ProgressBarChart,
  DataTable,
  chartUtils 
} from '../components/charts/ChartComponents';
import { AuthContext } from '../context/AuthContext';
import reportingService from '../services/reportingService';

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
    let csv = 'Analytics Export Report\n';
    csv += `Generated on: ${new Date().toLocaleString()}\n`;
    csv += `Exported by: ${data.exported_by}\n`;
    csv += `Date Range: ${data.filters.date_range.startDate || 'All'} to ${data.filters.date_range.endDate || 'All'}\n`;
    csv += `Grouping: ${data.filters.grouping}\n\n`;

    // Dashboard KPIs Section
    if (data.dashboard_kpis) {
      csv += 'DASHBOARD KPIS\n';
      csv += 'Metric,Current Value,Previous Value\n';
      
      if (data.dashboard_kpis.sales) {
        csv += `Sales This Month,${data.dashboard_kpis.sales.current_month_amount || 0},${data.dashboard_kpis.sales.previous_month_amount || 0}\n`;
        csv += `Sales Count,${data.dashboard_kpis.sales.current_month_count || 0},${data.dashboard_kpis.sales.previous_month_count || 0}\n`;
      }
      
      if (data.dashboard_kpis.customers) {
        csv += `Active Customers,${data.dashboard_kpis.customers.active_customers || 0},\n`;
        csv += `New Customers,${data.dashboard_kpis.customers.new_customers || 0},\n`;
      }
      
      if (data.dashboard_kpis.tasks) {
        csv += `Task Completion Rate,${data.dashboard_kpis.tasks.completion_rate || 0}%,\n`;
        csv += `Completed Tasks,${data.dashboard_kpis.tasks.completed_tasks || 0},\n`;
        csv += `Pending Tasks,${data.dashboard_kpis.tasks.pending_tasks || 0},\n`;
      }
      
      csv += '\n';
    }

    // Sales Performance Section
    if (data.sales_performance) {
      csv += 'SALES PERFORMANCE\n';
      
      if (data.sales_performance.summary) {
        csv += 'Summary\n';
        csv += 'Metric,Value\n';
        csv += `Total Sales,${data.sales_performance.summary.total_sales || 0}\n`;
        csv += `Total Amount,${data.sales_performance.summary.total_amount || 0}\n`;
        csv += `Won Sales,${data.sales_performance.summary.won_sales || 0}\n`;
        csv += `Win Rate,${data.sales_performance.summary.win_rate || 0}%\n`;
        csv += '\n';
      }

      if (data.sales_performance.sales_by_status) {
        csv += 'Sales by Status\n';
        csv += 'Status,Count,Amount\n';
        data.sales_performance.sales_by_status.forEach(item => {
          csv += `${item.status},${item.count},${item.total_amount || 0}\n`;
        });
        csv += '\n';
      }
    }

    // Task Performance Section
    if (data.task_completion) {
      csv += 'TASK COMPLETION\n';
      
      if (data.task_completion.summary) {
        csv += 'Summary\n';
        csv += 'Metric,Value\n';
        csv += `Total Tasks,${data.task_completion.summary.total_tasks || 0}\n`;
        csv += `Completed Tasks,${data.task_completion.summary.completed_tasks || 0}\n`;
        csv += `Completion Rate,${data.task_completion.summary.completion_rate || 0}%\n`;
        csv += '\n';
      }

      if (data.task_completion.tasks_by_status) {
        csv += 'Tasks by Status\n';
        csv += 'Status,Count\n';
        data.task_completion.tasks_by_status.forEach(item => {
          csv += `${item.status},${item.count}\n`;
        });
        csv += '\n';
      }
    }

    // Performance Data Section (for admins/managers)
    if (data.sales_performance?.top_performers && isAdminOrManager) {
      csv += 'TOP SALES PERFORMERS\n';
      csv += 'Name,Total Sales,Total Amount,Won Sales\n';
      data.sales_performance.top_performers.forEach(performer => {
        const name = `${performer.assigned_to__first_name || ''} ${performer.assigned_to__last_name || ''}`.trim() || performer.assigned_to__username;
        csv += `${name},${performer.total_sales || 0},${performer.total_amount || 0},${performer.won_sales || 0}\n`;
      });
      csv += '\n';
    }

    if (data.task_completion?.user_performance && isAdminOrManager) {
      csv += 'TASK PERFORMANCE BY USER\n';
      csv += 'Name,Total Tasks,Completed Tasks,Completion Rate\n';
      data.task_completion.user_performance.forEach(user => {
        const name = `${user.assigned_to__first_name || ''} ${user.assigned_to__last_name || ''}`.trim() || user.assigned_to__username;
        csv += `${name},${user.total_tasks || 0},${user.completed_tasks || 0},${user.completion_rate || 0}%\n`;
      });
      csv += '\n';
    }

    // Conversion Metrics
    if (data.conversion_ratios) {
      csv += 'CONVERSION METRICS\n';
      
      if (data.conversion_ratios.sales_conversion) {
        csv += 'Sales Conversion\n';
        csv += 'Metric,Value\n';
        csv += `Total Opportunities,${data.conversion_ratios.sales_conversion.total_opportunities || 0}\n`;
        csv += `Won Opportunities,${data.conversion_ratios.sales_conversion.won_opportunities || 0}\n`;
        csv += `Win Rate,${data.conversion_ratios.sales_conversion.win_rate || 0}%\n`;
        csv += '\n';
      }

      if (data.conversion_ratios.customer_conversion) {
        csv += 'Customer Conversion\n';
        csv += 'Metric,Value\n';
        csv += `Total Leads,${data.conversion_ratios.customer_conversion.total_leads || 0}\n`;
        csv += `Converted Customers,${data.conversion_ratios.customer_conversion.converted_customers || 0}\n`;
        csv += `Conversion Rate,${data.conversion_ratios.customer_conversion.conversion_rate || 0}%\n`;
        csv += '\n';
      }
    }

    return csv;
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

  if (loading && !dashboardData) {
    return (
      <Container maxWidth="xl">
        <Box my={4}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress size={60} />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive analytics and insights for your CRM data
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton 
              onClick={() => setFilterExpanded(!filterExpanded)}
              color={filterExpanded ? "primary" : "default"}
            >
              {filterExpanded ? <ExpandLessIcon /> : <FilterIcon />}
            </IconButton>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading || refreshing || exporting}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleExport}
              disabled={loading || refreshing || exporting}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Filters */}
        <Collapse in={filterExpanded}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters & Options
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="End Date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Grouping</InputLabel>
                  <Select
                    value={grouping}
                    label="Grouping"
                    onChange={(e) => setGrouping(e.target.value)}
                  >
                    <MenuItem value="day">Daily</MenuItem>
                    <MenuItem value="week">Weekly</MenuItem>
                    <MenuItem value="month">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* KPI Cards */}
        {dashboardData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Sales This Month"
                value={chartUtils.formatCurrency(dashboardData.sales?.current_month_amount || 0)}
                change={chartUtils.calculateChange(
                  dashboardData.sales?.current_month_amount || 0,
                  dashboardData.sales?.previous_month_amount || 0
                )}
                changeType={
                  (dashboardData.sales?.current_month_amount || 0) >= 
                  (dashboardData.sales?.previous_month_amount || 0) ? 'positive' : 'negative'
                }
                subtitle="Current month performance"
                icon={<TrendingUpIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Customers"
                value={dashboardData.customers?.active_customers || 0}
                subtitle={`${dashboardData.customers?.new_customers || 0} new this month`}
                icon={<TrendingUpIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Task Completion"
                value={`${(dashboardData.tasks?.completion_rate || 0).toFixed(1)}%`}
                subtitle={`${dashboardData.tasks?.completed_tasks || 0}/${(dashboardData.tasks?.completed_tasks || 0) + (dashboardData.tasks?.pending_tasks || 0)} tasks`}
                icon={<TrendingUpIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ProgressBarChart
                title="Sales Won This Month"
                value={dashboardData.sales?.won_this_month || 0}
                max={dashboardData.sales?.current_month_count || 1}
                color="success"
              />
            </Grid>
          </Grid>
        )}

        {/* Charts Section */}
        {salesData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sales Performance Over Time
                </Typography>
                <LineChart
                  data={chartUtils.formatMultiSeriesData(salesData.sales_over_time || [], [
                    { label: 'Sales Count', key: 'count' },
                    { label: 'Total Amount ($)', key: 'total_amount' }
                  ])}
                  height={350}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sales by Status
                </Typography>
                <PieChart
                  data={chartUtils.formatPieData(salesData.sales_by_status || [], 'status', 'count')}
                  height={350}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Customer and Task Analytics */}
        {customerData && taskData && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Engagement Levels
                </Typography>
                <DoughnutChart
                  data={chartUtils.formatPieData(customerData.engagement_levels || [], 'engagement_level', 'count')}
                  height={300}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tasks by Priority
                </Typography>
                <BarChart
                  data={chartUtils.formatPieData(taskData.tasks_by_priority || [], 'priority', 'count')}
                  height={300}
                />
              </Paper>
            </Grid>
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