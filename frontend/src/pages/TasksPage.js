import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import { AuthContext } from '../context/AuthContext';
import {
    Container,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Dialog, // For TaskForm modal
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const TasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0); // For pagination if TaskList implements it
    const [rowsPerPage, setRowsPerPage] = useState(10); // For pagination

    const { user } = useContext(AuthContext);
    const isManager = user?.role === 'ADMIN' || user?.is_staff; // Ensure this matches your user model

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Pass pagination params if your backend supports it for tasks
            // const params = { limit: rowsPerPage, offset: page * rowsPerPage };
            const data = await taskService.getTasks(); // Modify if using params
            setTasks(data.results || data); // Adjust based on API response structure
            // Potentially set count for pagination from data.count if available
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch tasks';
            setError(errorMsg);
            console.error(err);
        }
        setIsLoading(false);
    }, [page, rowsPerPage]); // Add dependencies if using pagination params

    const fetchUsers = useCallback(async () => {
        if (isManager) {
            try {
                const userData = await taskService.getUsersForTaskAssignment();
                setUsers(userData.results || userData); // Adjust based on API response
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setError(err.response?.data?.detail || err.message || 'Failed to fetch users for assignment');
            }
        }
    }, [isManager]);

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, [fetchTasks, fetchUsers]);

    const handleCreateTask = () => {
        setEditingTask(null);
        setError(null); // Clear previous errors
        setShowForm(true);
    };

    const handleEditTask = (task) => {
        if (!isManager) return;
        setEditingTask(task);
        setError(null); // Clear previous errors
        setShowForm(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (!isManager) return;
        // Consider using a confirmation dialog here similar to Customers.js
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskService.deleteTask(taskId);
                setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (err) {
                const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete task';
                setError(errorMsg);
                console.error(err);
            }
        }
    };

    const handleFormSubmit = async (taskData) => {
        setIsLoading(true);
        setError(null);
        
        console.log('Submitting task:', taskData);
        console.log('Current user context:', user);
        
        // Permission logic:
        // - Managers (staff/admin) can create tasks for anyone
        // - Regular users can only create tasks for themselves
        // - For regular users, the assigned_to field is auto-populated with their ID and disabled in the UI
        try {
            if (editingTask) {
                await taskService.updateTask(editingTask.id, taskData);
            } else {
                await taskService.createTask(taskData);
            }
            setShowForm(false);
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || (editingTask ? 'Failed to update task' : 'Failed to create task');
            console.error('Task creation/update error:', err.response?.data);
            setError(errorMsg); // This error will be passed to TaskForm
        }
        setIsLoading(false);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingTask(null);
        setError(null); // Clear error when form is manually closed
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateTaskStatus(taskId, newStatus);
            // Update the task in the local state
            setTasks(prevTasks => 
                prevTasks.map(task => 
                    task.id === taskId 
                        ? { 
                            ...task, 
                            status: newStatus,
                            status_display: newStatus === 'P' ? 'Pending' : 
                                          newStatus === 'IP' ? 'In Progress' : 
                                          newStatus === 'C' ? 'Completed' : 
                                          newStatus === 'O' ? 'Overdue' : task.status_display
                          } 
                        : task
                )
            );
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to update task status';
            setError(errorMsg);
            console.error(err);
        }
    };

    const handleViewTask = (task) => {
        navigate(`/tasks/${task.id}`);
    };

    // Pagination handlers - if TaskList will support it
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg">
            <Box my={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Task Management
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateTask}
                        disabled={isLoading}
                    >
                        Create New Task
                    </Button>
                </Box>

                {isLoading && tasks.length === 0 && <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>}
                {error && !showForm && <Alert severity="error" sx={{ mb: 2 }}>{typeof error === 'string' ? error : JSON.stringify(error)}</Alert>}

                <TaskList 
                    tasks={tasks}
                    onEdit={isManager ? handleEditTask : null}
                    onDelete={isManager ? handleDeleteTask : null}
                    onStatusChange={handleStatusChange}
                    onRowClick={handleViewTask}
                    // Pass pagination props if TaskList is updated to use them
                    // page={page}
                    // rowsPerPage={rowsPerPage}
                    // count={tasks.length} // Replace with total count from API if paginating server-side
                    // onPageChange={handleChangePage}
                    // onRowsPerPageChange={handleChangeRowsPerPage}
                />

                {showForm && (
                    <TaskForm 
                        open={showForm}
                        task={editingTask}
                        users={isManager ? users : [user]} // For regular users, only show themselves
                        onSubmit={handleFormSubmit}
                        onClose={handleFormClose}
                        isLoading={isLoading}
                        apiError={error} // Pass API error to form for display
                        isManager={isManager} // Pass if user is manager
                    />
                )}
            </Box>
        </Container>
    );
};

export default TasksPage; 