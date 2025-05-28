import React, { useState, useEffect } from 'react';
import { 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
    FormHelperText,
    CircularProgress,
    Alert,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO } from 'date-fns';

const TaskForm = ({ open, task, users, onSubmit, onClose, isLoading, apiError, isManager }) => {
    const [formData, setFormData] = useState({
        title: '',
        notes: '',
        due_date: null,
        priority: 'M', // Default to Medium
        status: 'P',   // Default to Pending
        assigned_to: ''
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                notes: task.notes || '',
                due_date: task.due_date ? new Date(task.due_date) : null,
                priority: task.priority || 'M',
                status: task.status || 'P',
                assigned_to: task.assigned_to || ''
            });
        } else {
            // For new tasks: if non-manager, automatically assign to self
            const selfAssignId = !isManager && users && users.length > 0 ? users[0].id : '';
            console.log('Setting assigned_to for non-manager:', { isManager, selfUser: users?.[0], selfAssignId });
            
            // Reset for new task form
            setFormData({
                title: '',
                notes: '',
                due_date: null,
                priority: 'M',
                status: isManager ? 'P' : 'IP', // Set to In Progress for non-managers
                assigned_to: isManager ? '' : selfAssignId
            });
        }
        // Reset form errors
        setFormErrors({});
    }, [task, open, isManager, users]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field when changed
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, due_date: date }));
        
        // Clear due_date error if any
        if (formErrors.due_date) {
            setFormErrors(prev => ({ ...prev, due_date: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }
        if (!formData.due_date) {
            errors.due_date = 'Due date is required';
        }
        if (!formData.assigned_to) {
            errors.assigned_to = 'Please assign the task to a user';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        
        // Format date for API
        const formDataForSubmit = {
            ...formData,
            due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        };
        
        onSubmit(formDataForSubmit);
    };

    return (
        <Dialog 
            open={open} 
            onClose={isLoading ? undefined : onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ 
                elevation: 3,
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle>
                <Typography variant="h5" component="div" fontWeight="medium" color="primary">
                    {task ? 'Edit Task' : 'Create New Task'}
                </Typography>
            </DialogTitle>
            
            <DialogContent dividers>
                {apiError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {typeof apiError === 'object' ? JSON.stringify(apiError) : apiError}
                    </Alert>
                )}
                
                <Box component="form" id="task-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                id="title"
                                name="title"
                                label="Title"
                                value={formData.title}
                                onChange={handleChange}
                                error={!!formErrors.title}
                                helperText={formErrors.title}
                                disabled={isLoading}
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="notes"
                                name="notes"
                                label="Notes"
                                multiline
                                rows={4}
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={isLoading}
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Due Date"
                                    value={formData.due_date}
                                    onChange={handleDateChange}
                                    slotProps={{ 
                                        textField: { 
                                            fullWidth: true,
                                            required: true,
                                            margin: "normal",
                                            error: !!formErrors.due_date,
                                            helperText: formErrors.due_date
                                        } 
                                    }}
                                    disabled={isLoading}
                                />
                            </LocalizationProvider>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl 
                                fullWidth 
                                margin="normal"
                                error={!!formErrors.assigned_to}
                                disabled={isLoading || !isManager}
                            >
                                <InputLabel id="assigned-to-label">Assigned To</InputLabel>
                                <Select
                                    labelId="assigned-to-label"
                                    id="assigned_to"
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleChange}
                                    label="Assigned To"
                                    required
                                >
                                    <MenuItem value="">
                                        <em>Select User</em>
                                    </MenuItem>
                                    {users && users.map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.username} ({user.first_name} {user.last_name})
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formErrors.assigned_to && (
                                    <FormHelperText>{formErrors.assigned_to}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" disabled={isLoading}>
                                <InputLabel id="priority-label">Priority</InputLabel>
                                <Select
                                    labelId="priority-label"
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    label="Priority"
                                >
                                    <MenuItem value="L">Low</MenuItem>
                                    <MenuItem value="M">Medium</MenuItem>
                                    <MenuItem value="H">High</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" disabled={isLoading}>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value="P">Pending</MenuItem>
                                    <MenuItem value="IP">In Progress</MenuItem>
                                    <MenuItem value="C">Completed</MenuItem>
                                    <MenuItem value="O">Overdue</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                <Button 
                    onClick={onClose} 
                    disabled={isLoading}
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button 
                    type="submit"
                    form="task-form"
                    variant="contained" 
                    color="primary"
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                    {isLoading ? 'Saving...' : 'Save Task'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskForm; 