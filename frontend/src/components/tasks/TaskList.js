import React from 'react';
import TaskItem from './TaskItem';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box
} from '@mui/material';

const TaskList = ({ tasks, onEdit, onDelete, onStatusChange, onRowClick }) => {
    if (!tasks || tasks.length === 0) {
        return (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1">No tasks found.</Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="tasks table">
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Title</TableCell>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Due Date</TableCell>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Priority</TableCell>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Assigned To</TableCell>
                        {(onEdit || onDelete) && <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Actions</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onEdit={onEdit} 
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                            onClick={() => onRowClick && onRowClick(task)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TaskList; 