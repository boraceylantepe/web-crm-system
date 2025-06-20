import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Collapse,
  Badge,
  Paper,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as SalesIcon,
  Task as TaskIcon,
  Event as CalendarIcon,
  ManageAccounts as UserManagementIcon,
  Assessment as AnalyticsIcon,
  Description as ReportsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  AccountBox as ProfileIcon,
  Logout as LogoutIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import PasswordChange from '../auth/PasswordChange';
import NotificationMenu from '../notifications/NotificationMenu';
import { useTheme } from '../../context/ThemeContext';


const drawerWidth = 280; // Increased drawer width for better spacing

// Main navigation items
const mainMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', section: 'main' },
];

// Apps section items
const appsMenuItems = [
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers', section: 'apps' },
  { text: 'Sales', icon: <SalesIcon />, path: '/sales', section: 'apps' },
  { text: 'Tasks', icon: <TaskIcon />, path: '/tasks', section: 'apps' },
  { text: 'Calendar', icon: <CalendarIcon />, path: '/calendar', section: 'apps' },
];

// Analytics & Reports section
const analyticsMenuItems = [
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', section: 'analytics' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports', section: 'analytics' },
];

// Admin and Manager only menu items
const adminMenuItems = [
  { text: 'User Management', icon: <UserManagementIcon />, path: '/users', section: 'admin' },
];

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    apps: true,
    analytics: true,
    admin: true
  });
  
  const { user, logout, passwordChangeRequired, isAdminOrManager } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (passwordChangeRequired) {
      setPasswordDialogOpen(true);
    }
  }, [passwordChangeRequired]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handlePasswordChange = () => {
    handleMenuClose();
    setPasswordDialogOpen(true);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  const renderNavSection = (title, items, section, collapsible = false) => {
    const isExpanded = expandedSections[section] !== false;
    
    return (
      <React.Fragment key={section}>
        {collapsible ? (
          <ListItemButton 
            onClick={() => handleSectionToggle(section)}
            sx={{ mx: 1, borderRadius: 1 }}
          >
            <ListItemText 
              primary={title}
              primaryTypographyProps={{
                variant: 'caption',
                sx: { 
                  fontWeight: 'bold',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }
              }}
            />
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        ) : (
          <ListSubheader
            component="div"
            sx={{
              bgcolor: 'transparent',
              color: 'text.secondary',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: 1,
              py: 1,
              px: 2
            }}
          >
            {title}
          </ListSubheader>
        )}
        
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {items.map((item) => (
          <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={isActiveRoute(item.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        </Collapse>
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              bgcolor: 'primary.main',
              border: `2px solid`,
              borderColor: 'primary.light'
            }}
          >
            <BusinessIcon sx={{ fontSize: 24, color: 'primary.contrastText' }} />
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            CRM System
          </Typography>
        </Box>
      </Toolbar>
      
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ pt: 2 }}>
          {renderNavSection('MAIN', mainMenuItems, 'main')}
          
          <Divider sx={{ my: 2 }} />
          {renderNavSection('APPS', appsMenuItems, 'apps')}
          
          <Divider sx={{ my: 2 }} />
          {renderNavSection('ANALYTICS', analyticsMenuItems, 'analytics', true)}
          
          {isAdminOrManager && (
            <>
              <Divider sx={{ my: 2 }} />
              {renderNavSection('ADMINISTRATION', adminMenuItems, 'admin', true)}
            </>
          )}
      </List>
      </Box>
      
      {/* User info at bottom */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={user?.profile_picture_url ? (() => {
              let imageUrl = user.profile_picture_url;
              if (imageUrl.startsWith('/media/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
              }
              return imageUrl.includes('?') ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;
            })() : undefined} 
            sx={{ 
              width: 40, 
              height: 40,
              mr: 1.5,
              bgcolor: user?.profile_picture_url ? 'transparent' : 'secondary.main' 
            }}
          >
            {!user?.profile_picture_url && (user?.first_name?.[0] || user?.username?.[0] || 'U')}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { 
            xs: '100%',
            sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          ml: { 
            xs: 0,
            sm: sidebarOpen ? `${drawerWidth}px` : 0
          },
          transition: 'width 0.3s, margin 0.3s',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Desktop sidebar toggle button */}
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
          >
            {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>



          <Box sx={{ flexGrow: 1 }} />
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          
            {/* Theme toggle */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {/* Calendar shortcut */}
            <IconButton
              color="inherit"
              component={Link}
              to="/calendar"
              title="Calendar"
            >
              <CalendarIcon />
            </IconButton>

            {/* Notifications */}
            <NotificationMenu />

            {/* Profile menu */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar 
                src={user?.profile_picture_url ? (() => {
                  let imageUrl = user.profile_picture_url;
                  if (imageUrl.startsWith('/media/')) {
                    imageUrl = `http://localhost:8000${imageUrl}`;
                  }
                  return imageUrl.includes('?') ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;
                })() : undefined} 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: user?.profile_picture_url ? 'transparent' : 'secondary.main' 
                }}
              >
                {!user?.profile_picture_url && (user?.first_name?.[0] || user?.username?.[0] || 'U')}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
            <Menu
              anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
        PaperProps={{
          sx: { mt: 1, minWidth: 200 }
        }}
            >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handlePasswordChange}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
              </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>

      {/* Sidebar drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: sidebarOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
        aria-label="navigation folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="persistent"
          open={sidebarOpen}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { 
            xs: '100%',
            sm: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          transition: 'width 0.3s'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      
      {/* Password Change Dialog */}
      <PasswordChange 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
      />
    </Box>
  );
};

export default Layout; 