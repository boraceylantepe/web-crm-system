import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TableSortLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getUsers, deleteUser } from '../services/userService';
import { AuthContext } from '../context/AuthContext';

const getRoleChipColor = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'error';
    case 'MANAGER':
      return 'warning';
    default:
      return 'info';
  }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [orderBy, setOrderBy] = useState('first_name');
  const [order, setOrder] = useState('asc');
  
  const { user, isAdmin, isAdminOrManager } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin/manager users
    if (!isAdminOrManager) {
      navigate('/');
    }
    
    fetchUsers();
  }, [isAdminOrManager, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
        // Handle case where API returns paginated results
        setUsers(data.results);
      } else {
        console.error('Unexpected API response format:', data);
        setUsers([]);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]); // Ensure users is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleDeleteClick = (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    setUserToDelete(userToDelete);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSortedUsers = (users, order, orderBy) => {
    return [...users].sort((a, b) => {
      let aValue, bValue;

      if (orderBy === 'name') {
        aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
      } else if (orderBy === 'role') {
        aValue = (a.role_display || a.role || '').toLowerCase();
        bValue = (b.role_display || b.role || '').toLowerCase();
      } else if (orderBy === 'status') {
        return order === 'asc' 
          ? (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1)
          : (a.is_active === b.is_active ? 0 : a.is_active ? 1 : -1);
      } else {
        aValue = (a[orderBy] || '').toLowerCase();
        bValue = (b[orderBy] || '').toLowerCase();
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const safeUsers = Array.isArray(users) ? users : [];
  
  const filteredUsers = safeUsers.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(search.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(search.toLowerCase()))
  );
  
  const sortedUsers = getSortedUsers(filteredUsers, order, orderBy);

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" component="h1">User Management</Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />} 
                  onClick={fetchUsers}
                  sx={{ mr: 1 }}
                >
                  Refresh
                </Button>
                {isAdmin && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />} 
                    component={Link} 
                    to="/users/add"
                  >
                    New User
                  </Button>
                )}
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Search Users"
              variant="outlined"
              fullWidth
              margin="normal"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'name'}
                          direction={orderBy === 'name' ? order : 'asc'}
                          onClick={() => handleRequestSort('name')}
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'email'}
                          direction={orderBy === 'email' ? order : 'asc'}
                          onClick={() => handleRequestSort('email')}
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Email
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'role'}
                          direction={orderBy === 'role' ? order : 'asc'}
                          onClick={() => handleRequestSort('role')}
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Role
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                          sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role_display || user.role} 
                              color={getRoleChipColor(user.role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.is_active ? "Active" : "Inactive"} 
                              color={user.is_active ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {user.role === 'ADMIN' && user.id !== user.id ? (
                              <Typography variant="caption" color="text.secondary">
                                Admin user
                              </Typography>
                            ) : (
                              <>
                                <IconButton 
                                  component={Link} 
                                  to={`/users/edit/${user.id}`}
                                  color="primary"
                                  size="small"
                                  disabled={
                                    (user.role === 'ADMIN' && user.id !== user.id) || 
                                    (!isAdmin && (user.role === 'MANAGER' || user.role === 'ADMIN'))
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                {((isAdmin) || (!isAdmin && user.role !== 'MANAGER' && user.role !== 'ADMIN')) && 
                                 user.role !== 'ADMIN' && user.id !== user.id && (
                                  <IconButton 
                                    onClick={() => handleDeleteClick(user.id)}
                                    color="error"
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm User Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the user {userToDelete?.first_name} {userToDelete?.last_name}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users; 