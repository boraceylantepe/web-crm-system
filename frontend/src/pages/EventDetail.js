import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateUtils';
import calendarService from '../services/calendarService';
import EventParticipantsList from '../components/calendar/EventParticipantsList';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Event type colors for visual clarity
  const eventTypeColors = {
    'MEETING': '#1976d2', // Blue
    'CALL': '#2e7d32',    // Green
    'DEADLINE': '#d32f2f', // Red
    'REVIEW': '#ed6c02',  // Orange
    'OTHER': '#9c27b0'    // Purple
  };
  
  const getEventTypeColor = (eventType) => eventTypeColors[eventType] || '#757575';
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await calendarService.getEventById(id);
        setEvent(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  const handleEditEvent = () => {
    navigate(`/calendar/edit/${id}`);
  };
  
  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarService.deleteEvent(id);
        navigate('/calendar');
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event. Please try again.');
      }
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box my={4} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
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
            component={Link}
            to="/calendar"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Calendar
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!event) {
    return (
      <Container maxWidth="md">
        <Box my={4}>
          <Alert severity="info">Event not found.</Alert>
          <Button
            component={Link}
            to="/calendar"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Calendar
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            component={Link}
            to="/calendar"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Event Details
          </Typography>
          <Box>
            <IconButton
              color="primary"
              aria-label="edit event"
              onClick={handleEditEvent}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              aria-label="delete event"
              onClick={handleDeleteEvent}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar sx={{ bgcolor: getEventTypeColor(event.event_type) }}>
                  <EventIcon />
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" component="h2">
                  {event.title}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={event.event_type_display}
                    sx={{
                      bgcolor: getEventTypeColor(event.event_type),
                      color: 'white'
                    }}
                    size="small"
                  />
                  {event.is_all_day && (
                    <Chip
                      label="All Day"
                      sx={{ ml: 1 }}
                      size="small"
                      color="secondary"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            {/* Time and Location */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                When & Where
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <AccessTimeIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body1">
                    {event.is_all_day ? (
                      formatDateTime(event.start_time).split(' ')[0] // Just the date part
                    ) : (
                      <>
                        {formatDateTime(event.start_time)}
                        {' to '}
                        {formatDateTime(event.end_time)}
                      </>
                    )}
                  </Typography>
                  {event.is_all_day && (
                    <Typography variant="body2" color="text.secondary">
                      All Day Event
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {event.location && (
                <Box display="flex" alignItems="center">
                  <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    {event.location}
                  </Typography>
                </Box>
              )}
            </Grid>
            
            {/* Organizer and Related */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Organizer & Related
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Organized by: {event.owner_name}
                </Typography>
              </Box>
              
              {event.customer_name && (
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    Related to Customer: {' '}
                    <Link to={`/customers/${event.customer}`}>
                      {event.customer_name}
                    </Link>
                  </Typography>
                </Box>
              )}
              
              {event.sale_title && (
                <Box display="flex" alignItems="center">
                  <MoneyIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    Related to Sale: {' '}
                    <Link to={`/sales/${event.sale}`}>
                      {event.sale_title}
                    </Link>
                  </Typography>
                </Box>
              )}
            </Grid>
            
            {/* Description */}
            {event.description && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="flex-start">
                  <DescriptionIcon sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {event.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            {/* Participants */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Participants
              </Typography>
              
              {event.participants_details && event.participants_details.length > 0 ? (
                <List>
                  {event.participants_details.map((participant) => (
                    <ListItem key={participant.id}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={participant.full_name} 
                        secondary={participant.email} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No participants
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default EventDetail; 