import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Menu,
  Tooltip,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as TimeIcon,
  Stop as StopIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import reportingService from '../services/reportingService';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Generated reports state
  const [generatedReports, setGeneratedReports] = useState([]);
  
  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Report generation state
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({});

  // Action menu state
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    report_type: 'sales_performance',
    filters: {},
    metrics: [],
    date_range: {},
    grouping: { period: 'month' },
    is_public: false
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    template_id: '',
    frequency: 'weekly',
    scheduled_time: '09:00',
    day_of_week: 1,
    day_of_month: 1,
    recipients: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 0) {
        await loadTemplates();
      } else if (activeTab === 1) {
        await loadGeneratedReports();
      } else if (activeTab === 2) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await reportingService.templates.getTemplates();
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
      throw error;
    }
  };

  const loadGeneratedReports = async () => {
    try {
      const response = await reportingService.reports.getReports();
      setGeneratedReports(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading generated reports:', error);
      throw error;
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await reportingService.schedules.getSchedules();
      setSchedules(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      throw error;
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      report_type: 'sales_performance',
      filters: {},
      metrics: [],
      date_range: {},
      grouping: { period: 'month' },
      is_public: false
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      report_type: template.report_type,
      filters: template.filters || {},
      metrics: template.metrics || [],
      date_range: template.date_range || {},
      grouping: template.grouping || { period: 'month' },
      is_public: template.is_public
    });
    setShowTemplateModal(true);
    handleCloseActionMenu();
  };

  const handleSaveTemplate = async () => {
    try {
      if (selectedTemplate) {
        await reportingService.templates.updateTemplate(selectedTemplate.id, templateForm);
      } else {
        await reportingService.templates.createTemplate(templateForm);
      }
      setShowTemplateModal(false);
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template. Please try again.');
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      await reportingService.templates.duplicateTemplate(templateId);
      await loadTemplates();
      handleCloseActionMenu();
    } catch (error) {
      console.error('Error duplicating template:', error);
      setError('Failed to duplicate template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await reportingService.templates.deleteTemplate(templateId);
        await loadTemplates();
        handleCloseActionMenu();
      } catch (error) {
        console.error('Error deleting template:', error);
        setError('Failed to delete template. Please try again.');
      }
    }
  };

  const handleGenerateReport = async (templateId) => {
    try {
      setGenerating(true);
      setGenerationProgress({ [templateId]: 'processing' });
      
      const response = await reportingService.templates.generateReport(templateId);
      
      setGenerationProgress({ [templateId]: 'completed' });
      
      // Reload generated reports if we're on that tab
      if (activeTab === 1) {
        await loadGeneratedReports();
      }
      
      handleCloseActionMenu();
      console.log('Report generated:', response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      setGenerationProgress({ [templateId]: 'failed' });
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId, reportName, format = 'csv') => {
    try {
      if (format === 'csv') {
        await reportingService.utils.downloadCSV(reportId, `${reportName}.csv`);
      } else if (format === 'pdf') {
        // PDF download would be implemented here
        console.log('PDF download not yet implemented');
      }
      handleCloseActionMenu();
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again.');
    }
  };

  // Schedule management functions
  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setScheduleForm({
      name: '',
      template_id: '',
      frequency: 'weekly',
      scheduled_time: '09:00',
      day_of_week: 1,
      day_of_month: 1,
      recipients: [],
      is_active: true
    });
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleForm({
      name: schedule.name,
      template_id: schedule.template.id,
      frequency: schedule.frequency,
      scheduled_time: schedule.scheduled_time,
      day_of_week: schedule.day_of_week || 1,
      day_of_month: schedule.day_of_month || 1,
      recipients: schedule.recipients || [],
      is_active: schedule.is_active
    });
    setShowScheduleModal(true);
    handleCloseActionMenu();
  };

  const handleSaveSchedule = async () => {
    try {
      if (selectedSchedule) {
        await reportingService.schedules.updateSchedule(selectedSchedule.id, scheduleForm);
      } else {
        await reportingService.schedules.createSchedule(scheduleForm);
      }
      setShowScheduleModal(false);
      await loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule. Please try again.');
    }
  };

  const handleToggleSchedule = async (scheduleId) => {
    try {
      await reportingService.schedules.toggleSchedule(scheduleId);
      await loadSchedules();
      handleCloseActionMenu();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      setError('Failed to toggle schedule. Please try again.');
    }
  };

  const handleRunScheduleNow = async (scheduleId) => {
    try {
      await reportingService.schedules.runNow(scheduleId);
      setError(null);
      alert('Schedule executed successfully!');
      handleCloseActionMenu();
    } catch (error) {
      console.error('Error running schedule:', error);
      setError('Failed to run schedule. Please try again.');
    }
  };

  const handleOpenActionMenu = (event, item, type) => {
    setActionMenu(event.currentTarget);
    setSelectedItem({ ...item, type });
  };

  const handleCloseActionMenu = () => {
    setActionMenu(null);
    setSelectedItem(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      processing: 'warning',
      completed: 'success',
      failed: 'error'
    };
    return <Chip label={status} color={variants[status] || 'default'} size="small" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'processing':
        return <CircularProgress size={16} />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <TimeIcon color="action" />;
    }
  };

  const renderTemplatesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Report Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          New Template
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {template.name}
                      </Typography>
                      {template.description && (
                        <Typography variant="caption" color="text.secondary">
                          {template.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={template.report_type.replace('_', ' ').toUpperCase()}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {template.is_public ? (
                      <Chip label="Public" color="success" size="small" />
                    ) : (
                      <Chip label="Private" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleOpenActionMenu(e, template, 'template')}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderGeneratedReportsTab = () => (
    <Box>
      <Typography variant="h6" mb={3}>Generated Reports</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Generated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {generatedReports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getStatusIcon(report.status)}
                      <Box ml={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {report.template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {report.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.template.report_type.replace('_', ' ').toUpperCase()}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {report.status === 'completed' && (
                      <IconButton
                        onClick={(e) => handleOpenActionMenu(e, report, 'report')}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderSchedulesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Scheduled Reports</Typography>
        <Button
          variant="contained"
          startIcon={<ScheduleIcon />}
          onClick={handleCreateSchedule}
        >
          New Schedule
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Template</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next Run</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {schedule.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {schedule.recipients?.length || 0} recipients
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.template.name}
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.frequency.toUpperCase()}
                      color="default"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.next_run ? (
                      new Date(schedule.next_run).toLocaleString()
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not scheduled
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.is_active ? (
                      <Chip label="Active" color="success" size="small" />
                    ) : (
                      <Chip label="Inactive" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleOpenActionMenu(e, schedule, 'schedule')}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderActionMenu = () => (
    <Menu
      anchorEl={actionMenu}
      open={Boolean(actionMenu)}
      onClose={handleCloseActionMenu}
    >
      {selectedItem?.type === 'template' && [
        <MenuItem key="generate" onClick={() => handleGenerateReport(selectedItem.id)}>
          <PlayIcon sx={{ mr: 1 }} fontSize="small" />
          Generate Report
          {generationProgress[selectedItem.id] && (
            <Box ml={1}>
              {getStatusIcon(generationProgress[selectedItem.id])}
            </Box>
          )}
        </MenuItem>,
        <MenuItem key="edit" onClick={() => handleEditTemplate(selectedItem)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>,
        <MenuItem key="duplicate" onClick={() => handleDuplicateTemplate(selectedItem.id)}>
          <CopyIcon sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>,
        <MenuItem key="delete" onClick={() => handleDeleteTemplate(selectedItem.id)}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" color="error" />
          Delete
        </MenuItem>
      ]}

      {selectedItem?.type === 'report' && [
        <MenuItem key="download-csv" onClick={() => handleDownloadReport(selectedItem.id, selectedItem.template.name, 'csv')}>
          <GetAppIcon sx={{ mr: 1 }} fontSize="small" />
          Download CSV
        </MenuItem>,
        <MenuItem key="download-pdf" onClick={() => handleDownloadReport(selectedItem.id, selectedItem.template.name, 'pdf')}>
          <GetAppIcon sx={{ mr: 1 }} fontSize="small" />
          Download PDF
        </MenuItem>,
        <MenuItem key="share" onClick={handleCloseActionMenu}>
          <ShareIcon sx={{ mr: 1 }} fontSize="small" />
          Share Report
        </MenuItem>
      ]}

      {selectedItem?.type === 'schedule' && [
        <MenuItem key="run" onClick={() => handleRunScheduleNow(selectedItem.id)}>
          <PlayIcon sx={{ mr: 1 }} fontSize="small" />
          Run Now
        </MenuItem>,
        <MenuItem key="toggle" onClick={() => handleToggleSchedule(selectedItem.id)}>
          {selectedItem.is_active ? (
            <>
              <StopIcon sx={{ mr: 1 }} fontSize="small" />
              Deactivate
            </>
          ) : (
            <>
              <PlayIcon sx={{ mr: 1 }} fontSize="small" />
              Activate
            </>
          )}
        </MenuItem>,
        <MenuItem key="edit" onClick={() => handleEditSchedule(selectedItem)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>,
        <MenuItem key="delete" onClick={() => {
          if (window.confirm('Are you sure you want to delete this schedule?')) {
            reportingService.schedules.deleteSchedule(selectedItem.id);
            loadSchedules();
          }
          handleCloseActionMenu();
        }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" color="error" />
          Delete
        </MenuItem>
      ]}
    </Menu>
  );

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create custom reports, manage templates, schedule automated reports, and view generated reports.
            </Typography>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Templates" />
            <Tab label="Generated Reports" />
            <Tab label="Schedules" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && renderTemplatesTab()}
        {activeTab === 1 && renderGeneratedReportsTab()}
        {activeTab === 2 && renderSchedulesTab()}

        {/* Action Menu */}
        {renderActionMenu()}

        {/* Template Modal */}
        <Dialog 
          open={showTemplateModal} 
          onClose={() => setShowTemplateModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={templateForm.report_type}
                      label="Report Type"
                      onChange={(e) => setTemplateForm({ ...templateForm, report_type: e.target.value })}
                    >
                      <MenuItem value="sales_performance">Sales Performance</MenuItem>
                      <MenuItem value="customer_engagement">Customer Engagement</MenuItem>
                      <MenuItem value="task_completion">Task Completion</MenuItem>
                      <MenuItem value="conversion_ratios">Conversion Ratios</MenuItem>
                      <MenuItem value="user_activity">User Activity</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Grouping Period</InputLabel>
                    <Select
                      value={templateForm.grouping?.period || 'month'}
                      label="Grouping Period"
                      onChange={(e) => setTemplateForm({ 
                        ...templateForm, 
                        grouping: { ...templateForm.grouping, period: e.target.value }
                      })}
                    >
                      <MenuItem value="day">Daily</MenuItem>
                      <MenuItem value="week">Weekly</MenuItem>
                      <MenuItem value="month">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={templateForm.is_public}
                        onChange={(e) => setTemplateForm({ ...templateForm, is_public: e.target.checked })}
                      />
                    }
                    label="Make this template public (visible to all users)"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate} 
              variant="contained"
              disabled={!templateForm.name}
            >
              {selectedTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Modal */}
        <Dialog 
          open={showScheduleModal} 
          onClose={() => setShowScheduleModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedSchedule ? 'Edit Schedule' : 'Create New Schedule'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Schedule Name"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={scheduleForm.template_id}
                      label="Template"
                      onChange={(e) => setScheduleForm({ ...scheduleForm, template_id: e.target.value })}
                      required
                    >
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={scheduleForm.frequency}
                      label="Frequency"
                      onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Scheduled Time"
                    type="time"
                    value={scheduleForm.scheduled_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                {scheduleForm.frequency === 'weekly' && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Day of Week</InputLabel>
                      <Select
                        value={scheduleForm.day_of_week}
                        label="Day of Week"
                        onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                      >
                        <MenuItem value={1}>Monday</MenuItem>
                        <MenuItem value={2}>Tuesday</MenuItem>
                        <MenuItem value={3}>Wednesday</MenuItem>
                        <MenuItem value={4}>Thursday</MenuItem>
                        <MenuItem value={5}>Friday</MenuItem>
                        <MenuItem value={6}>Saturday</MenuItem>
                        <MenuItem value={0}>Sunday</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {scheduleForm.frequency === 'monthly' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Day of Month"
                      type="number"
                      value={scheduleForm.day_of_month}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_month: parseInt(e.target.value) })}
                      inputProps={{ min: 1, max: 31 }}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recipients (comma-separated emails)"
                    value={scheduleForm.recipients?.join(', ') || ''}
                    onChange={(e) => setScheduleForm({ 
                      ...scheduleForm, 
                      recipients: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                    })}
                    placeholder="user1@example.com, user2@example.com"
                    helperText="Enter email addresses separated by commas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={scheduleForm.is_active}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, is_active: e.target.checked })}
                      />
                    }
                    label="Activate schedule immediately"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSchedule} 
              variant="contained"
              disabled={!scheduleForm.name || !scheduleForm.template_id}
            >
              {selectedSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Reports; 