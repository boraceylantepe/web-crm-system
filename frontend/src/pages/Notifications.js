import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  TaskAlt as TaskIcon,
  AttachMoney as SalesIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  MarkChatRead as MarkReadIcon,
} from '@mui/icons-material';
import { NotificationContext } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useContext(NotificationContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch latest notifications when component mounts
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // Get icon based on category
  const getNotificationIcon = (category) => {
    if (!category) return <InfoIcon />;

    switch (category.toLowerCase()) {
      case 'task':
        return <TaskIcon color="success" />;
      case 'sale':
        return <SalesIcon color="warning" />;
      case 'customer':
        return <PeopleIcon color="primary" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Format notification timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" color="inherit">
            Dashboard
          </MuiLink>
          <Typography color="textPrimary">Notifications</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Notifications</Typography>
          <Box>
            <Tooltip title="Mark all as read">
              <IconButton onClick={markAllAsRead} disabled={loading}>
                <MarkReadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notification settings">
              <IconButton component={Link} to="/notifications/settings">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Paper elevation={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any notifications yet. They will appear here when you receive them.
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', padding: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: notification.is_read
                        ? 'transparent'
                        : 'rgba(25, 118, 210, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      py: 2,
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: notification.category_color || 'primary.main',
                        }}
                      >
                        {getNotificationIcon(notification.category_name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.is_read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.primary', display: 'block', mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            {formatTimestamp(notification.created_at)}
                          </Typography>
                        </>
                      }
                    />
                    {!notification.is_read && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 2,
                        }}
                      />
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Notifications; 