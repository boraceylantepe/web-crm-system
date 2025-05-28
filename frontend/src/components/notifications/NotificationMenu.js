import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  ListItemAvatar,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  TaskAlt as TaskIcon,
  AttachMoney as SalesIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  MarkChatRead as MarkReadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { NotificationContext } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useContext(NotificationContext);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Fetch latest notifications when menu opens
    fetchNotifications();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    handleMenuClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
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
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={handleMenuOpen}
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: '350px',
            maxHeight: '450px',
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={handleMarkAllAsRead}>
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Notification settings">
              <IconButton size="small" component={Link} to="/notifications/settings" onClick={handleMenuClose}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ width: '100%', padding: 0 }}>
              {notifications.slice(0, 5).map((notification) => (
                <ListItem
                  key={notification.id}
                  component={Link}
                  to={notification.action_url || '#'}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
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
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.is_read ? 'normal' : 'bold',
                          display: 'block',
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            display: 'block',
                            fontSize: '0.875rem',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: 'block',
                            fontSize: '0.75rem',
                            mt: 0.5,
                          }}
                        >
                          {formatTimestamp(notification.created_at)}
                        </Typography>
                      </>
                    }
                  />
                  {!notification.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        ml: 1,
                      }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
            
            {notifications.length > 5 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  component={Link}
                  to="/notifications"
                  onClick={handleMenuClose}
                  color="primary"
                  size="small"
                >
                  View All ({notifications.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu; 