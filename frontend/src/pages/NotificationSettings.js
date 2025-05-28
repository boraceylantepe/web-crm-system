import React, { useContext, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Divider,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

const NotificationSettings = () => {
  const { preferences, updatePreferences } = useContext(NotificationContext);
  const [formValues, setFormValues] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Initialize form values when preferences are loaded
  React.useEffect(() => {
    if (preferences) {
      setFormValues({ ...preferences });
    }
  }, [preferences]);
  
  if (!preferences || !formValues) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" gutterBottom>
            Loading notification preferences...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  const handleSwitchChange = (event) => {
    const { name, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const success = await updatePreferences(formValues);
      if (success) {
        setSuccessMessage('Notification preferences updated successfully!');
      } else {
        setErrorMessage('Failed to update notification preferences. Please try again.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while updating preferences.');
      console.error(error);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Typography color="textPrimary">Notification Settings</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" gutterBottom>
          Notification Preferences
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Delivery Methods
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.in_app_notifications}
                        onChange={handleSwitchChange}
                        name="in_app_notifications"
                        color="primary"
                      />
                    }
                    label="In-App Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.email_notifications}
                        onChange={handleSwitchChange}
                        name="email_notifications"
                        color="primary"
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Notification Categories
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.task_notifications}
                        onChange={handleSwitchChange}
                        name="task_notifications"
                        color="primary"
                      />
                    }
                    label="Task Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.sales_notifications}
                        onChange={handleSwitchChange}
                        name="sales_notifications"
                        color="primary"
                      />
                    }
                    label="Sales Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.customer_notifications}
                        onChange={handleSwitchChange}
                        name="customer_notifications"
                        color="primary"
                      />
                    }
                    label="Customer Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.system_notifications}
                        onChange={handleSwitchChange}
                        name="system_notifications"
                        color="primary"
                      />
                    }
                    label="System Notifications"
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Priority Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="minimum-priority-label">Minimum Priority to Notify</InputLabel>
                <Select
                  labelId="minimum-priority-label"
                  id="minimum_priority"
                  name="minimum_priority"
                  value={formValues.minimum_priority}
                  onChange={handleSelectChange}
                  label="Minimum Priority to Notify"
                >
                  <MenuItem value="low">Low (All notifications)</MenuItem>
                  <MenuItem value="medium">Medium (Medium and High priority only)</MenuItem>
                  <MenuItem value="high">High (High priority only)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                Save Preferences
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettings; 