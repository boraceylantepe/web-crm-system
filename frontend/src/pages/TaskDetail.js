import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Paper, 
    Typography, 
    Box, 
    Grid, 
    Chip, 
    Button, 
    CircularProgress, 
    Divider,
    Alert 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthContext } from '../context/AuthContext';
import taskService from '../services/taskService';
import TaskComments from '../components/tasks/TaskComments';

const TaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const data = await taskService.getTaskById(id);
                setTask(data);
            } catch (err) {
                console.error('Error fetching task:', err);
                setError('Failed to load task details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    const handleStatusChange = async (status) => {
        try {
            const updatedTask = await taskService.updateTaskStatus(id, status);
            setTask(updatedTask);
        } catch (err) {
            console.error('Error updating task status:', err);
            setError('Failed to update task status. Please try again later.');
        }
    };

    // Helper functions for formatting and display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'H': return 'error';
            case 'M': return 'warning';
            case 'L': return 'info';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'C': return 'success';
            case 'IP': return 'info';
            case 'O': return 'error';
            case 'P': return 'warning';
            default: return 'default';
        }
    };

    const isAssignedToMe = task && user?.id === task.assigned_to;
    const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const canChangeStatus = isAssignedToMe || isManager;

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md">
                <Box my={4}>
                    <Alert severity="error">{error}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/tasks')}
                        sx={{ mt: 2 }}
                    >
                        Back to Tasks
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!task) {
        return (
            <Container maxWidth="md">
                <Box my={4}>
                    <Alert severity="info">Task not found.</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/tasks')}
                        sx={{ mt: 2 }}
                    >
                        Back to Tasks
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/tasks')}
                    sx={{ mb: 3 }}
                >
                    Back to Tasks
                </Button>

                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" component="h1">
                            {task.title}
                        </Typography>
                        {canChangeStatus && (
                            <Box>
                                <Button 
                                    variant={task.status === 'P' ? 'contained' : 'outlined'}
                                    color="warning"
                                    onClick={() => handleStatusChange('P')}
                                    sx={{ mr: 1 }}
                                >
                                    Pending
                                </Button>
                                <Button 
                                    variant={task.status === 'IP' ? 'contained' : 'outlined'}
                                    color="info"
                                    onClick={() => handleStatusChange('IP')}
                                    sx={{ mr: 1 }}
                                >
                                    In Progress
                                </Button>
                                <Button 
                                    variant={task.status === 'C' ? 'contained' : 'outlined'}
                                    color="success"
                                    onClick={() => handleStatusChange('C')}
                                >
                                    Complete
                                </Button>
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box mb={2}>
                                <Typography variant="subtitle1" component="div" color="text.secondary">
                                    Status
                                </Typography>
                                <Chip 
                                    label={task.status_display || task.status} 
                                    color={getStatusColor(task.status)}
                                />
                            </Box>
                            <Box mb={2}>
                                <Typography variant="subtitle1" component="div" color="text.secondary">
                                    Priority
                                </Typography>
                                <Chip 
                                    label={task.priority_display || task.priority} 
                                    color={getPriorityColor(task.priority)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box mb={2}>
                                <Typography variant="subtitle1" component="div" color="text.secondary">
                                    Due Date
                                </Typography>
                                <Typography variant="body1">{formatDate(task.due_date)}</Typography>
                            </Box>
                            <Box mb={2}>
                                <Typography variant="subtitle1" component="div" color="text.secondary">
                                    Assigned To
                                </Typography>
                                <Typography variant="body1">{task.assigned_to_username || 'N/A'}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box mb={2}>
                                <Typography variant="subtitle1" component="div" color="text.secondary">
                                    Notes
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="body1" component="div" style={{ whiteSpace: 'pre-line' }}>
                                        {task.notes || 'No notes added.'}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Task Comments Section */}
                <TaskComments taskId={id} />
            </Box>
        </Container>
    );
};

export default TaskDetail; 