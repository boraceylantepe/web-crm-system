import React, { useState, useContext } from 'react';
import { 
    TableRow, 
    TableCell, 
    IconButton, 
    Tooltip, 
    Chip,
    Menu,
    MenuItem
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import taskService from '../../services/taskService';

const TaskItem = ({ task, onEdit, onDelete, onStatusChange, onClick, style }) => {
    const { user } = useContext(AuthContext);
    const isManager = user?.is_staff || user?.role === 'ADMIN';
    const isAssignedToMe = user?.id === task.assigned_to;
    
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    
    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'H': // High
                return 'error';
            case 'M': // Medium
                return 'warning';
            case 'L': // Low
                return 'info';
            default:
                return 'default';
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'C': // Completed
                return 'success';
            case 'IP': // In Progress
                return 'info';
            case 'O': // Overdue
                return 'error';
            case 'P': // Pending
                return 'warning';
            default:
                return 'default';
        }
    };
    
    const handleStatusMenuOpen = (event) => {
        event.stopPropagation(); // Prevent row click when clicking on status chip
        setAnchorEl(event.currentTarget);
    };
    
    const handleStatusMenuClose = () => {
        setAnchorEl(null);
    };
    
    const handleStatusChange = async (newStatus) => {
        try {
            await taskService.updateTaskStatus(task.id, newStatus);
            if (onStatusChange) {
                onStatusChange(task.id, newStatus);
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
        handleStatusMenuClose();
    };
    
    const handleEditClick = (e) => {
        e.stopPropagation(); // Prevent row click when clicking edit button
        if (onEdit) onEdit(task);
    };
    
    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent row click when clicking delete button
        if (onDelete) onDelete(task.id);
    };

    return (
        <TableRow 
            hover 
            onClick={onClick} 
            style={{ ...style }}
        >
            <TableCell>{task.title}</TableCell>
            <TableCell>{formatDate(task.due_date)}</TableCell>
            <TableCell>
                <Chip 
                    label={task.priority_display || task.priority} 
                    color={getPriorityColor(task.priority)}
                    size="small"
                />
            </TableCell>
            <TableCell>
                {(isManager || isAssignedToMe) ? (
                    <>
                        <Chip 
                            label={task.status_display || task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                            onClick={handleStatusMenuOpen}
                            style={{ cursor: 'pointer' }}
                        />
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleStatusMenuClose}
                            onClick={(e) => e.stopPropagation()} // Prevent row click when interacting with menu
                        >
                            <MenuItem onClick={() => handleStatusChange('P')}>Pending</MenuItem>
                            <MenuItem onClick={() => handleStatusChange('IP')}>In Progress</MenuItem>
                            <MenuItem onClick={() => handleStatusChange('C')}>Completed</MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Chip 
                        label={task.status_display || task.status} 
                        color={getStatusColor(task.status)}
                        size="small"
                    />
                )}
            </TableCell>
            <TableCell>{task.assigned_to_username || 'N/A'}</TableCell>
            {(onEdit || onDelete) && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                        <Tooltip title="Edit Task">
                            <IconButton 
                                onClick={handleEditClick} 
                                color="primary" 
                                size="small"
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onDelete && (
                        <Tooltip title="Delete Task">
                            <IconButton 
                                onClick={handleDeleteClick} 
                                color="error" 
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
};

export default TaskItem; 