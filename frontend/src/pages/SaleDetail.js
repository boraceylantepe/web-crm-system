import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  CircularProgress,
  Divider,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getSaleById, updateSale, getSaleNotes, createSaleNote, deleteSale } from '../services/saleService';
import { SALE_STATUSES } from '../utils/constants';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sale, setSale] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  
  // Status colors mapping
  const statusColors = {
    'NEW': 'primary',
    'CONTACTED': 'info',
    'PROPOSAL': 'warning',
    'NEGOTIATION': 'secondary',
    'WON': 'success',
    'LOST': 'error'
  };
  
  // Status options
  const statusOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'PROPOSAL', label: 'Proposal Sent' },
    { value: 'NEGOTIATION', label: 'Negotiation' },
    { value: 'WON', label: 'Won' },
    { value: 'LOST', label: 'Lost' }
  ];
  
  // Priority options
  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }
  ];
  
  useEffect(() => {
    fetchSaleDetails();
    fetchSaleNotes();
  }, [id]);
  
  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const saleData = await getSaleById(id);
      setSale(saleData);
      setFormData(saleData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sale details:', err);
      setError('Failed to load sale details. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchSaleNotes = async () => {
    try {
      console.log("Fetching notes for sale:", id);
      const notesData = await getSaleNotes(id);
      console.log("Received notes data:", notesData);
      
      // Ensure notes is always an array and sort by created_at in descending order
      const notesArray = Array.isArray(notesData) ? notesData : 
                        (notesData && notesData.results ? notesData.results : []);
                        
      // Sort notes by created_at in descending order (newest first)
      const sortedNotes = [...notesArray].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setNotes(sortedNotes);
    } catch (err) {
      console.error('Error fetching sale notes:', err);
      setNotes([]);
    }
  };
  
  const handleEditToggle = () => {
    setEditMode(!editMode);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSaveChanges = async () => {
    try {
      await updateSale(id, formData);
      fetchSaleDetails();
      setEditMode(false);
    } catch (err) {
      console.error('Error updating sale:', err);
      setError('Failed to update sale. Please try again.');
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAddingNote(true);
      await createSaleNote({ 
        sale: id,
        content: newNote,
        is_update: false
      });
      setNewNote('');
      await fetchSaleNotes();
      setAddingNote(false);
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
      setAddingNote(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await deleteSale(id);
        navigate('/sales');
      } catch (err) {
        console.error('Error deleting sale:', err);
        setError('Failed to delete opportunity. Please try again.');
      }
    }
  };
  
  const goBack = () => {
    navigate('/sales');
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
        >
          Back to Sales
        </Button>
      </Container>
    );
  }
  
  if (!sale) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Sale not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{ mt: 2 }}
        >
          Back to Sales
        </Button>
      </Container>
    );
  }
  
  // Extract display values for customer and assigned user
  const customerName = sale.customer_details?.name || 'Unknown Customer';
  const customerEmail = sale.customer_details?.email || '';
  const assignedToName = sale.assigned_to_details?.full_name || 'Unassigned';
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          {!editMode ? (
            <Typography variant="h4" component="h1">
              {sale.title}
            </Typography>
          ) : (
            <TextField
              variant="outlined"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              sx={{ mb: 2, minWidth: 300 }}
            />
          )}
        </Box>
        <Box>
          {!editMode ? (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveChanges}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditMode(false);
                  setFormData(sale);
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="h6">
                      {customerName}
                    </Typography>
                    {customerEmail && (
                      <Typography variant="body2" color="text.secondary">
                        {customerEmail}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="h6">
                      {assignedToName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Expected Close
                    </Typography>
                    {!editMode ? (
                      <Typography variant="h6">
                        {formatDate(sale.expected_close_date)}
                      </Typography>
                    ) : (
                      <TextField
                        type="date"
                        variant="outlined"
                        name="expected_close_date"
                        value={formData.expected_close_date || ''}
                        onChange={handleInputChange}
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Value
                    </Typography>
                    {!editMode ? (
                      <Typography variant="h6" sx={{ color: 'success.main' }}>
                        ${Number(sale.amount).toLocaleString()}
                      </Typography>
                    ) : (
                      <TextField
                        type="number"
                        variant="outlined"
                        name="amount"
                        value={formData.amount || ''}
                        onChange={handleInputChange}
                        InputProps={{
                          startAdornment: '$'
                        }}
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography paragraph>
              {sale.description || 'No description provided.'}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(sale.created_at)} | Updated: {formatDate(sale.updated_at)}
                </Typography>
              </Box>
              <Box>
                <Chip 
                  label={`Priority: ${sale.priority}`} 
                  size="small" 
                  sx={{ mr: 1 }}
                  color={
                    sale.priority === 'HIGH' ? 'error' : 
                    sale.priority === 'MEDIUM' ? 'warning' : 'success'
                  }
                />
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes & Updates
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a note about this opportunity..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List sx={{ width: '100%' }}>
              {Array.isArray(notes) && notes.length > 0 ? (
                notes.map((note) => (
                  <React.Fragment key={note.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          {note.author?.first_name?.charAt(0) || 'U'}
                          {note.author?.last_name?.charAt(0) || ''}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" component="span">
                              {note.author?.first_name || ''} {note.author?.last_name || 'User'}
                              {note.is_update && (
                                <Chip 
                                  label="Update" 
                                  size="small" 
                                  color="info" 
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(note.created_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            sx={{ display: 'inline', mt: 1 }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                            style={{ whiteSpace: 'pre-line' }}
                          >
                            {note.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No notes or updates yet. Add the first one!
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ mb: 3 }}>
            <List>
              <ListItem button component={Link} to={`/customers/${sale.customer}`}>
                <ListItemText
                  primary="Customer Details"
                  secondary={sale.customer_name}
                />
              </ListItem>
              <Divider />
              <ListItem button component={Link} to="/tasks">
                <ListItemText
                  primary="Tasks"
                  secondary="View related tasks"
                />
                <Chip label="0" size="small" />
              </ListItem>
              <Divider />
              <ListItem button component={Link} to="/calendar">
                <ListItemText
                  primary="Calendar Events"
                  secondary="View related events"
                />
                <Chip label="0" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SaleDetail; 