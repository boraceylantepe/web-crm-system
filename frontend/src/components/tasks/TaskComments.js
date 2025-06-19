import React, { useState, useEffect, useContext } from 'react';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper, 
    Divider, 
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Cancel as CancelIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import taskService from '../../services/taskService';

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const TaskComments = ({ taskId }) => {
    const { user } = useContext(AuthContext);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentText, setEditedCommentText] = useState('');

    // Fetch comments when the component mounts or taskId changes
    useEffect(() => {
        console.log(`TaskComments useEffect triggered with taskId: ${taskId}`);
        if (taskId) {
            // Always clear state and fetch fresh
            setComments([]);
            setError(null);
            setEditingCommentId(null);
            setEditedCommentText('');
            setNewComment('');
            fetchComments();
        }
    }, [taskId]);

    const fetchComments = async (forceRefresh = false) => {
        if (!taskId) {
            console.log('No taskId provided, skipping comment fetch');
            return;
        }
        
        console.log(`Fetching comments for task ${taskId} (forceRefresh: ${forceRefresh})`);
        setLoading(true);
        setError(null);
        
        try {
            const response = await taskService.getTaskComments(taskId);
            console.log('Raw API response:', response);
            
            // Ensure comments is always an array
            const fetchedComments = Array.isArray(response) ? response : [];
            console.log(`Setting ${fetchedComments.length} comments for task ${taskId}:`, fetchedComments);
            setComments(fetchedComments);
            
            if (fetchedComments.length === 0) {
                console.log('No comments found for this task');
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            
            // Set more specific error messages
            let errorMessage = 'Failed to load comments.';
            if (err.response?.status === 403) {
                errorMessage = 'You do not have permission to view comments on this task.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Task not found.';
            }
            
            setError(errorMessage);
            setComments([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        setError(null);
        try {
            console.log(`Submitting comment for task ${taskId}: "${newComment}"`);
            const response = await taskService.addTaskComment(taskId, newComment);
            
            // Always refresh comments after adding to ensure we have the latest data
            console.log('Comment added successfully, refreshing comments list');
            await fetchComments(true);
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
            console.error('Response data:', err.response?.data);
            console.error('Response status:', err.response?.status);
            
            let errorMessage = 'Failed to add comment. Please try again later.';
            
            if (err.response) {
                if (err.response.status === 403) {
                    errorMessage = 'You do not have permission to comment on this task.';
                } else if (err.response.status === 404) {
                    errorMessage = 'Task not found.';
                } else if (err.response.status === 400) {
                    // Handle validation errors
                    const validationErrors = err.response.data;
                    if (typeof validationErrors === 'object') {
                        const errorMessages = Object.entries(validationErrors)
                            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                            .join('; ');
                        errorMessage = `Validation error: ${errorMessages}`;
                    } else if (typeof validationErrors === 'string') {
                        errorMessage = validationErrors;
                    }
                } else if (err.response.data && err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const startEditingComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditedCommentText(comment.comment);
    };

    const cancelEditingComment = () => {
        setEditingCommentId(null);
        setEditedCommentText('');
    };

    const saveEditedComment = async (commentId) => {
        if (!editedCommentText.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const updatedComment = await taskService.updateTaskComment(commentId, editedCommentText);
            if (updatedComment && typeof updatedComment === 'object') {
                setComments(prevComments => 
                    prevComments.map(c => 
                        c.id === commentId ? { ...c, comment: updatedComment.comment, updated_at: updatedComment.updated_at } : c
                    )
                );
            } else {
                // Refresh comments if the response isn't what we expected
                fetchComments();
            }
            setEditingCommentId(null);
        } catch (err) {
            console.error('Error updating comment:', err);
            setError('Failed to update comment. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        setLoading(true);
        setError(null);
        try {
            await taskService.deleteTaskComment(commentId);
            setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError('Failed to delete comment. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Ensure comments is an array before rendering
    const commentsArray = Array.isArray(comments) ? comments : [];

    return (
        <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                    Comments
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => fetchComments(true)}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loading && commentsArray.length === 0 ? (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress size={30} />
                </Box>
            ) : error ? (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', mb: 2 }}>
                    <Typography>{error}</Typography>
                </Paper>
            ) : commentsArray.length === 0 ? (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                    <Typography>No comments yet.</Typography>
                </Paper>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', mb: 2 }}>
                    {commentsArray.map((comment) => (
                        <React.Fragment key={comment.id}>
                            <ListItem
                                alignItems="flex-start"
                                secondaryAction={
                                    (user?.id === comment.user || user?.role === 'ADMIN') && (
                                        <Box>
                                            {editingCommentId === comment.id ? (
                                                <>
                                                    <IconButton 
                                                        edge="end" 
                                                        aria-label="save" 
                                                        onClick={() => saveEditedComment(comment.id)}
                                                        disabled={loading}
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                    <IconButton 
                                                        edge="end" 
                                                        aria-label="cancel" 
                                                        onClick={cancelEditingComment}
                                                        disabled={loading}
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton 
                                                        edge="end" 
                                                        aria-label="edit" 
                                                        onClick={() => startEditingComment(comment)}
                                                        disabled={loading}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton 
                                                        edge="end" 
                                                        aria-label="delete" 
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Box>
                                    )
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{comment.user_username?.charAt(0) || '?'}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={comment.user_username}
                                    secondary={
                                        <React.Fragment>
                                            {editingCommentId === comment.id ? (
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    variant="outlined"
                                                    value={editedCommentText}
                                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                                    disabled={loading}
                                                    autoFocus
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            ) : (
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.primary"
                                                        sx={{ display: 'block' }}
                                                    >
                                                        {comment.comment}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {formatDate(comment.created_at)}
                                                        {comment.updated_at !== comment.created_at && 
                                                            ` (edited ${formatDate(comment.updated_at)})`}
                                                    </Typography>
                                                </>
                                            )}
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                        </React.Fragment>
                    ))}
                </List>
            )}

            <Paper component="form" onSubmit={handleAddComment} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={loading}
                    sx={{ mr: 2 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    type="submit"
                    disabled={!newComment.trim() || loading}
                >
                    Post
                </Button>
            </Paper>
        </Box>
    );
};

export default TaskComments; 