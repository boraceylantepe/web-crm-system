import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  Container,
  Paper,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Switch,
  FormControlLabel,
  Autocomplete,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  DateRange as DateRangeIcon,
  Task as TaskIcon,
  AttachMoney as SaleIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import calendarService from '../services/calendarService';
import { getCustomers } from '../services/customerService';
import { getSales } from '../services/saleService';
import { AuthContext } from '../context/AuthContext';

// Custom styles for the calendar
const calendarStyles = {
  wrapper: {
    '& .fc': {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      '--fc-border-color': 'rgba(0, 0, 0, 0.12)',
      '--fc-event-border-color': 'transparent',
      '--fc-today-bg-color': 'rgba(25, 118, 210, 0.08)',
      '--fc-page-bg-color': '#fff',
      '--fc-neutral-bg-color': '#f5f5f5',
      '--fc-list-event-hover-bg-color': 'rgba(25, 118, 210, 0.04)',
      '--fc-highlight-color': 'rgba(25, 118, 210, 0.15)',
      '--fc-now-indicator-color': '#f44336',
      '--fc-more-link-bg-color': 'rgba(25, 118, 210, 0.15)',
      '--fc-more-link-text-color': '#1976d2',
      '--fc-popover-body-background-color': '#fff',
      '--fc-popover-border-color': 'rgba(0, 0, 0, 0.12)',
    },
    '& .fc-header-toolbar': {
      marginBottom: '1.5rem !important',
      '@media (max-width: 600px)': {
        flexDirection: 'column',
        gap: '0.5rem'
      }
    },
    '& .fc-button': {
      textTransform: 'capitalize',
      padding: '0.6rem 1rem',
      height: 'auto',
      boxShadow: 'none',
      fontSize: '0.875rem',
      fontWeight: 500,
      borderRadius: '4px',
      transition: 'background-color 0.2s ease'
    },
    '& .fc-button-primary': {
      backgroundColor: '#1976d2',
      borderColor: '#1976d2'
    },
    '& .fc-button-primary:hover': {
      backgroundColor: '#1565c0',
      borderColor: '#1565c0'
    },
    '& .fc-button-primary:disabled': {
      backgroundColor: 'rgba(25, 118, 210, 0.5)',
      borderColor: 'rgba(25, 118, 210, 0.5)'
    },
    '& .fc-daygrid-day-top': {
      padding: '0.5rem',
      fontSize: '1rem',
      fontWeight: 500
    },
    '& .fc-daygrid-day.fc-day-today': {
      backgroundColor: 'rgba(25, 118, 210, 0.08)'
    },
    '& .fc-event': {
      padding: '1px 3px',
      margin: '1px 0',
      cursor: 'pointer',
      borderRadius: '4px',
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.3,
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    },
    '& .fc-event:hover': {
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      transform: 'translateY(-1px)'
    },
    '& .fc-daygrid-event': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minHeight: '1.5em'
    },
    '& .fc-event-time': {
      fontWeight: 500,
      fontSize: '0.7rem',
      padding: 0,
      margin: 0
    },
    '& .fc-event-title': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: '0.75rem',
      padding: 0,
      margin: 0
    },
    '& .fc-event-main': {
      padding: '1px 0',
      minHeight: '1.2em'
    },
    '& .fc-col-header-cell': {
      padding: '1rem 0',
      fontWeight: 500,
      backgroundColor: 'rgba(0, 0, 0, 0.02)'
    },
    '& .fc-list-event-dot': {
      display: 'none'
    },
    '& .fc-list-event-time': {
      width: '150px'
    },
    '& .fc-list-event-graphic': {
      paddingRight: '8px'
    },
    '& .fc-list-event td': {
      padding: '12px 8px'
    },
    '& .fc-list-day-cushion': {
      padding: '12px 16px',
      backgroundColor: '#f5f5f5'
    },
    '& .fc-timegrid-slot': {
      height: '3em'
    },
    '& .fc-timegrid-now-indicator-line': {
      borderColor: '#f44336',
      borderWidth: '2px'
    },
    '& .fc-timegrid-now-indicator-arrow': {
      borderColor: '#f44336',
      borderWidth: '5px'
    },
    '& .fc-non-business': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)'
    },
    // More link styling
    '& .fc-daygrid-more-link': {
      fontSize: '0.75rem',
      color: '#1976d2',
      fontWeight: 'bold',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      padding: '2px 5px',
      borderRadius: '10px',
      margin: '2px 0',
      display: 'inline-block',
      textAlign: 'center',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        color: '#0d47a1',
        textDecoration: 'none'
      }
    },
    // Custom event types
    '& .calendar-event-task': {
      cursor: 'pointer',
      fontWeight: '500',
      // Use dynamic colors from backend - don't override backgroundColor
      '&:hover': {
        opacity: '0.8',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }
    },
    '& .calendar-event-sale': {
      cursor: 'pointer',
      fontWeight: '500',
      // Use dynamic colors from backend - don't override backgroundColor
      '&:hover': {
        opacity: '0.8',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }
    },
    // Event draggable styles
    '& .event-draggable': {
      cursor: 'move',
      borderLeft: '2px solid transparent',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 0 2px rgba(0, 0, 0, 0.4)'
      },
      '&:hover': {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.2)',
        transform: 'translateY(-2px)'
      }
    },
    '& .event-non-draggable': {
      cursor: 'pointer',
      position: 'relative'
    },
    // More popover styles
    '& .fc-more-popover': {
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      overflow: 'hidden',
      maxHeight: '400px',
      maxWidth: '350px',
      zIndex: 1000
    },
    '& .fc-popover-header': {
      backgroundColor: '#f5f5f5',
      padding: '8px 10px',
      fontWeight: 500,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    '& .fc-popover-title': {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#333'
    },
    '& .fc-popover-close': {
      fontSize: '1.2rem',
      color: '#666',
      cursor: 'pointer',
      '&:hover': {
        color: '#333'
      }
    },
    '& .fc-popover-body': {
      padding: '8px',
      maxHeight: '350px',
      overflowY: 'auto'
    },
    // Time grid view specific styles
    '& .fc-timegrid-event': {
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '2px 4px',
      cursor: 'pointer',
      margin: '0 1px',
      zIndex: 1,
      '&:hover': {
        zIndex: 5,
        boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
      }
    },
    // Make the more events section clickable
    '& .fc-timegrid-more-link': {
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      color: '#1976d2',
      fontWeight: 'bold',
      borderRadius: '4px',
      padding: '2px 4px',
      margin: '1px 0',
      cursor: 'pointer',
      zIndex: 10,
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        color: '#0d47a1'
      }
    },
    // Fix z-index issues with popovers
    '& .fc-popover': {
      zIndex: 1000
    },
    // Make the events in popover look better
    '& .fc-popover .fc-event': {
      margin: '4px 0',
      borderRadius: '4px'
    },
  }
};

const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  
  // Debug user information
  useEffect(() => {
    console.log('User context data:', user);
    console.log('User ID in localStorage:', localStorage.getItem('user_id'));
  }, [user]);
  
  // State for calendar events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiDebug, setApiDebug] = useState(null);
  // Success message state removed
  
  // Auto-clear error message after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // State for event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    start_time: new Date(),
    end_time: new Date(new Date().getTime() + 3600000), // +1 hour
    is_all_day: false,
    event_type: 'MEETING',
    location: '',
    customer: '',
    sale: '',
    participants: [],
    owner: user?.id || '' // Initialize with current user ID
  });
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Options for dropdowns
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Event type colors with improved palette
  const eventTypeColors = {
    'MEETING': '#1976d2', // Blue
    'CALL': '#2e7d32',    // Green
    'DEADLINE': '#d32f2f', // Red
    'REVIEW': '#ed6c02',  // Orange
    'OTHER': '#9c27b0'    // Purple
  };

  // Fetch calendar events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiDebug(null);
      
      // Check authentication before proceeding
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication error: You need to log in again.');
        setApiDebug('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Log the token for debugging (just confirmation, not the actual token)
      console.log('Current token for API calls:', token ? 'Token exists' : 'No token found');

      const response = await calendarService.getCalendarEvents();
      console.log('Calendar events response:', response);
      
      // Handle paginated response format (results field)
      let eventsData = [];
      if (response && Array.isArray(response)) {
        // Direct array response
        eventsData = response;
      } else if (response && response.results && Array.isArray(response.results)) {
        // Paginated response with results array
        eventsData = response.results;
      } else {
        console.error('Unexpected calendar data format:', response);
        setApiDebug(JSON.stringify(response));
        setError('Received invalid calendar data format from server');
        setLoading(false);
        return;
      }
      
      console.log('Processing events data:', eventsData);
      
      // Map events to FullCalendar format
      const formattedEvents = eventsData.map(event => {
        console.log('Processing event:', event);
        
        // Check for valid date fields
        if (!event.start_time) {
          console.warn('Event missing start_time:', event);
          return null;
        }
        
        // Determine if this event is editable
        const isTask = event.extendedProps?.event_source === 'task';
        const isSale = event.extendedProps?.event_source === 'sale';
        const isEditable = !isTask && !isSale;
        
        // Determine the className based on event type
        let className = '';
        if (isTask) className = 'calendar-event-task';
        if (isSale) className = 'calendar-event-sale';
        
        // Create FullCalendar event object
        return {
          id: event.id,
          title: event.title,
          start: event.start_time,
          end: event.end_time || event.start_time, // Use start as fallback if no end time
          allDay: event.is_all_day,
          backgroundColor: event.backgroundColor || eventTypeColors[event.event_type] || '#757575',
          borderColor: 'transparent',
          textColor: isTask || isSale ? undefined : '#fff',
          editable: isEditable, // Only regular events are editable
          durationEditable: isEditable,
          startEditable: isEditable,
          className: className,
          extendedProps: {
            description: event.description,
            event_type: event.event_type,
            location: event.location,
            customer: event.customer,
            customer_name: event.customer_name,
            sale: event.sale,
            sale_title: event.sale_title,
            owner: event.owner,
            owner_name: event.owner_name,
            participants: event.participants,
            participants_details: event.participants_details,
            // Additional fields for tasks and sales - copy them from extendedProps if available
            ...(event.extendedProps || {})
          }
        };
      }).filter(Boolean); // Remove null events
      
      console.log('Formatted events for calendar:', formattedEvents);
      setEvents(formattedEvents);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      
      // Handle different types of errors
      if (err.response && err.response.status === 401) {
        setError('Authentication error: Your session has expired. Please log in again.');
        setApiDebug('Token has expired or is invalid. You will be redirected to the login page shortly.');
        
        // Redirect to login after a delay to allow user to see the message
        setTimeout(() => {
          localStorage.setItem('redirect_after_login', '/calendar');
          window.location.href = '/login';
        }, 3000);
      } else {
        setError('Failed to load calendar events. Please try again.');
      }
      
      if (err.response) {
        console.error('API Error response:', err.response.data);
        console.error('API Error status:', err.response.status);
        setApiDebug(`Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        console.error('API Error request:', err.request);
        setApiDebug('No response received from server. Check if backend is running.');
      } else {
        setApiDebug(`Error: ${err.message}`);
      }
      setLoading(false);
    }
  };
  
  // Fetch dropdown options
  const fetchOptions = async () => {
    try {
      // Fetch customers
      const customersData = await getCustomers();
      setCustomers(customersData.results || []);
      
      // Fetch sales
      const salesData = await getSales();
      setSales(salesData.results || []);
      
      // Fetch users for participants
      const usersData = await calendarService.getAvailableUsers();
      setUsers(usersData.results || []);
    } catch (err) {
      console.error('Error fetching options:', err);
      // Don't set error state for options - just log it
      // This allows the calendar to still load even if some options fail
    }
  };
  
  useEffect(() => {
    fetchEvents();
    fetchOptions();
  }, []);
  
  // Handle date click for creating new event
  const handleDateClick = (arg) => {
    // Reset form data
    setEventFormData({
      title: '',
      description: '',
      start_time: arg.date,
      end_time: new Date(arg.date.getTime() + 3600000), // +1 hour
      is_all_day: arg.allDay,
      event_type: 'MEETING',
      location: '',
      customer: '',
      sale: '',
      participants: [],
      owner: user?.id || '' // Set current user as owner
    });
    setFormMode('create');
    setCurrentEventId(null);
    setFormErrors({});
    setShowEventForm(true);
  };
  
  // Handle event click for viewing/editing
  const handleEventClick = (arg) => {
    const { event } = arg;
    const { extendedProps } = event;
    
    // Check if this is a task or sale event (read-only)
    if (extendedProps.event_source === 'task') {
      // Navigate to task detail page
      navigate(`/tasks/${extendedProps.task_id}`);
      return;
    } else if (extendedProps.event_source === 'sale') {
      // Navigate to sale detail page
      navigate(`/sales/${extendedProps.sale_id}`);
      return;
    }
    
    // For regular calendar events, continue with editing
    setEventFormData({
      title: event.title,
      description: extendedProps.description || '',
      start_time: new Date(event.start),
      end_time: event.end ? new Date(event.end) : new Date(event.start.getTime() + 3600000),
      is_all_day: event.allDay,
      event_type: extendedProps.event_type || 'MEETING',
      location: extendedProps.location || '',
      customer: extendedProps.customer || '',
      sale: extendedProps.sale || '',
      participants: extendedProps.participants || [],
      owner: extendedProps.owner || user?.id || '' // Get owner from event or default to current user
    });
    
    setFormMode('edit');
    setCurrentEventId(event.id);
    setFormErrors({});
    setShowEventForm(true);
  };
  
  // Handle event drag and drop
  const handleEventDrop = async (info) => {
    console.log('Event drop started:', info);
    
    const { event } = info;
    const { id, start, end, allDay } = event;
    const { extendedProps } = event;
    
    // Only update if this is a regular calendar event (not task or sale)
    if (extendedProps.event_source === 'task' || extendedProps.event_source === 'sale') {
      info.revert(); // Cancel the drag if this is a task or sale
      console.log('Drag cancelled - event is task or sale');
      return;
    }
    
    // Create updated event data with all required fields
    const updatedEvent = {
      start_time: start,
      end_time: end || start,
      is_all_day: allDay,
      // Include required fields from extendedProps
      title: event.title,
      owner: extendedProps.owner,
      event_type: extendedProps.event_type || 'MEETING'
    };
    
    console.log('Updating event after drag:', updatedEvent);
    
    // Don't show loading indicator as it causes UI refresh
    // Instead, we'll leave the event in its new position
    
    // Update the event on the backend
    try {
      await calendarService.updateEvent(id, updatedEvent);
      
      // Clear any error messages
      setError(null);
      setApiDebug(null);
      
      console.log('Event update successful');
    } catch (err) {
      console.error('Error updating event dates:', err);
      
      // Revert the drag
      info.revert();
      
      // Show error message
      if (err.response && err.response.status === 401) {
        setError('Authentication error: Your session has expired.');
      } else if (err.response && err.response.status === 400) {
        setError(`Failed to update event: ${JSON.stringify(err.response.data)}`);
        setApiDebug(`Missing fields in update: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Failed to update event. Please try again.');
      }
      
      console.log('Event update failed, drag reverted');
    }
  };
  
  // Handle event resize
  const handleEventResize = async (info) => {
    console.log('Event resize started:', info);
    
    const { event } = info;
    const { id, start, end } = event;
    const { extendedProps } = event;
    
    // Only update if this is a regular calendar event (not task or sale)
    if (extendedProps.event_source === 'task' || extendedProps.event_source === 'sale') {
      info.revert(); // Cancel the resize if this is a task or sale
      console.log('Resize cancelled - event is task or sale');
      return;
    }
    
    // Create updated event data with all required fields
    const updatedEvent = {
      start_time: start,
      end_time: end,
      // Include required fields from extendedProps
      title: event.title,
      owner: extendedProps.owner,
      event_type: extendedProps.event_type || 'MEETING'
    };
    
    console.log('Updating event after resize:', updatedEvent);
    
    // Don't show loading indicator as it causes UI refresh
    // Instead, we'll leave the event in its new size
    
    // Update the event on the backend
    try {
      await calendarService.updateEvent(id, updatedEvent);
      
      // Clear any error messages
      setError(null);
      setApiDebug(null);
      
      console.log('Event resize successful');
    } catch (err) {
      console.error('Error updating event duration:', err);
      
      // Revert the resize
      info.revert();
      
      // Show error message
      if (err.response && err.response.status === 401) {
        setError('Authentication error: Your session has expired.');
      } else if (err.response && err.response.status === 400) {
        setError(`Failed to update event: ${JSON.stringify(err.response.data)}`);
        setApiDebug(`Missing fields in update: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Failed to update event. Please try again.');
      }
      
      console.log('Event resize failed, resize reverted');
    }
  };
  
  // Custom event rendering
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const { extendedProps } = event;
    const isTask = extendedProps.event_source === 'task';
    const isSale = extendedProps.event_source === 'sale';
    const isMonthView = eventInfo.view.type === 'dayGridMonth';
    
    // Select icon based on event type
    let EventTypeIcon = EventIcon;
    let iconColor = 'inherit';
    
    if (isTask) {
      EventTypeIcon = TaskIcon;
      iconColor = '#f57c00';
    } else if (isSale) {
      EventTypeIcon = SaleIcon;
      iconColor = '#1976d2';
    } else if (event.allDay) {
      EventTypeIcon = DateRangeIcon;
      iconColor = eventTypeColors[extendedProps.event_type] || '#757575';
    } else {
      iconColor = eventTypeColors[extendedProps.event_type] || '#757575';
    }
    
    // In month view, make events more compact
    if (isMonthView) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '100%',
          overflow: 'hidden',
          fontSize: '0.75rem',
          padding: '0px 2px',
          minHeight: '1.2em'
        }}>
          <EventTypeIcon 
            fontSize="inherit" 
            sx={{ 
              mr: 0.5, 
              opacity: 0.8,
              color: iconColor,
              fontSize: '0.75rem',
            }} 
          />
          <Box sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontSize: '0.75rem',
            fontWeight: isTask || isSale ? 500 : 400,
            lineHeight: 1.2
          }}>
            {event.title}
          </Box>
        </Box>
      );
    }
    
    // For week/day views, show more details
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        px: 0.5,
        height: '100%',
        overflow: 'hidden'
      }}>
        <EventTypeIcon 
          fontSize="small" 
          sx={{ 
            mr: 0.5, 
            opacity: 0.8,
            color: iconColor
          }} 
        />
        <Box sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          fontSize: '0.85rem',
          fontWeight: isTask || isSale ? 500 : 400,
          lineHeight: 1.2
        }}>
          {event.title}
          {(event.extendedProps.location && !isTask && !isSale) && (
            <Typography component="span" sx={{ 
              display: 'block', 
              fontSize: '0.7rem', 
              opacity: 0.7,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {event.extendedProps.location}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventFormData({
      ...eventFormData,
      [name]: value
    });
  };
  
  // Handle date/time picker changes
  const handleDateChange = (name, value) => {
    setEventFormData({
      ...eventFormData,
      [name]: value
    });
  };
  
  // Handle toggle for all-day event
  const handleAllDayToggle = (e) => {
    setEventFormData({
      ...eventFormData,
      is_all_day: e.target.checked
    });
  };
  
  // Handle participants selection
  const handleParticipantsChange = (event, newValue) => {
    setEventFormData({
      ...eventFormData,
      participants: newValue.map(user => user.id)
    });
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!eventFormData.title) {
      errors.title = 'Title is required';
    }
    
    if (!eventFormData.start_time) {
      errors.start_time = 'Start time is required';
    }
    
    if (!eventFormData.end_time) {
      errors.end_time = 'End time is required';
    } else if (
      new Date(eventFormData.end_time) <= new Date(eventFormData.start_time) &&
      !eventFormData.is_all_day
    ) {
      errors.end_time = 'End time must be after start time';
    }
    
    return errors;
  };
  
  // Submit event form
  const handleSubmit = async () => {
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      // Prepare form data
      const formData = { ...eventFormData };
      
      // Remove empty fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null) {
          delete formData[key];
        }
      });
      
      // Ensure owner is set for new events
      if (!formData.owner && user?.id) {
        formData.owner = user.id;
      }
      
      console.log('Submitting event data:', formData);
      
      // Check authentication before proceeding
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication error: You need to log in again.');
        setApiDebug('No authentication token found. Please log in again.');
        return;
      }
      
      // Create or update event
      if (formMode === 'create') {
        await calendarService.createEvent(formData);
      } else {
        await calendarService.updateEvent(currentEventId, formData);
      }
      
      // Refresh events
      await fetchEvents();
      
      // Close form
      setShowEventForm(false);
    } catch (err) {
      console.error('Error saving event:', err);
      
      // Handle different types of errors
      if (err.response && err.response.status === 401) {
        setError('Authentication error: Your session has expired. Please log in again.');
        setApiDebug('Token has expired or is invalid. You will be redirected to the login page shortly.');
        
        // Redirect to login after a delay to allow user to see the message
        setTimeout(() => {
          localStorage.setItem('redirect_after_login', '/calendar');
          window.location.href = '/login';
        }, 3000);
      } else {
        setError('Failed to save event. Please try again.');
      }
      
      if (err.response) {
        console.error('API Error response:', err.response.data);
        setApiDebug(`Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
      }
    }
  };
  
  // Delete event
  const handleDelete = async () => {
    if (!currentEventId) return;
    
    try {
      await calendarService.deleteEvent(currentEventId);
      
      // Refresh events
      await fetchEvents();
      
      // Close form
      setShowEventForm(false);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
    }
  };
  
  // Format participant names for display
  const formatParticipants = (participants) => {
    if (!participants || !participants.length) return 'None';
    
    return participants
      .map(p => `${p.first_name} ${p.last_name}`.trim() || p.email)
      .join(', ');
  };

  // Handle more link click
  const handleMoreLinkClick = (info) => {
    console.log('More link clicked:', info);
    // Return 'popover' to display the popover
    return 'popover';
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="medium" color="primary" gutterBottom>
            Calendar
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              // Make sure we have a user ID
              const ownerId = user?.id || localStorage.getItem('user_id');
              
              if (!ownerId) {
                setError('User ID not available. Please refresh the page or login again.');
                return;
              }
              
              setEventFormData({
                title: '',
                description: '',
                start_time: new Date(),
                end_time: new Date(new Date().getTime() + 3600000), // +1 hour
                is_all_day: false,
                event_type: 'MEETING',
                location: '',
                customer: '',
                sale: '',
                participants: [],
                owner: ownerId
              });
              setFormMode('create');
              setCurrentEventId(null);
              setFormErrors({});
              setShowEventForm(true);
            }}
          >
            Add Event
          </Button>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {apiDebug && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Debug Info:</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '100px' }}>
              {apiDebug}
            </pre>
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: { xs: 1, sm: 3 }, borderRadius: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: '75vh', ...calendarStyles.wrapper }}>
              <FullCalendar
                key="calendar"
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventContent={renderEventContent}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={false}
                dayMaxEventRows={4}
                moreLinkText={count => `+${count} more`}
                moreLinkClick={handleMoreLinkClick}
                weekends={true}
                nowIndicator={true}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                  startTime: '09:00',
                  endTime: '17:00',
                }}
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                height="100%"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                allDaySlot={true}
                allDayText="All Day"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                dayHeaderFormat={{
                  weekday: 'short',
                  month: 'numeric',
                  day: 'numeric',
                  omitCommas: true
                }}
                firstDay={1} // Start week on Monday
                eventDragMinDistance={10} // Minimum pixels before a drag starts
                eventStartEditable={true} // Allow events to be dragged
                eventResizableFromStart={false} // Only allow resize from end
                droppable={false} // Don't allow external drops
                slotEventOverlap={false} // Events don't overlap in time view
                eventDraggable={true}
                eventNonStopable={false}
                forceEventDuration={true}
                dragScroll={true}
                progressiveEventRendering={true}
                slotMaxEventRows={4}
                eventDisplay="block"
                eventClassNames={(arg) => {
                  const { event } = arg;
                  const isTask = event.extendedProps.event_source === 'task';
                  const isSale = event.extendedProps.event_source === 'sale';
                  const classes = [];
                  
                  if (!isTask && !isSale) {
                    classes.push('event-draggable');
                  } else {
                    classes.push('event-non-draggable');
                  }
                  
                  return classes;
                }}
                eventAllow={(dropInfo, draggedEvent) => {
                  const isTask = draggedEvent.extendedProps.event_source === 'task';
                  const isSale = draggedEvent.extendedProps.event_source === 'sale';
                  
                  return !isTask && !isSale;
                }}
                moreLinkDidMount={(info) => {
                  if (info.el) {
                    info.el.style.cursor = 'pointer';
                    info.el.style.zIndex = '100';
                  }
                }}
              />
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Event Form Dialog */}
      <Dialog 
        open={showEventForm} 
        onClose={() => setShowEventForm(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 0, 
          backgroundColor: theme.palette.primary.main, 
          color: '#fff',
          fontSize: '1.25rem',
          fontWeight: 500
        }}>
          {formMode === 'create' ? 'Create New Event' : 'Edit Event'}
          <IconButton
            aria-label="close"
            onClick={() => setShowEventForm(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={eventFormData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                margin="normal"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <EventIcon color="action" sx={{ mr: 1, opacity: 0.6 }} />
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={eventFormData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                margin="normal"
                placeholder="Add details about this event..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Event Type</InputLabel>
                <Select
                  name="event_type"
                  value={eventFormData.event_type}
                  onChange={handleInputChange}
                  label="Event Type"
                >
                  <MenuItem value="MEETING">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: eventTypeColors['MEETING'] }} />
                      Meeting
                    </Box>
                  </MenuItem>
                  <MenuItem value="CALL">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: eventTypeColors['CALL'] }} />
                      Call
                    </Box>
                  </MenuItem>
                  <MenuItem value="DEADLINE">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: eventTypeColors['DEADLINE'] }} />
                      Deadline
                    </Box>
                  </MenuItem>
                  <MenuItem value="REVIEW">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: eventTypeColors['REVIEW'] }} />
                      Review
                    </Box>
                  </MenuItem>
                  <MenuItem value="OTHER">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: eventTypeColors['OTHER'] }} />
                      Other
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={eventFormData.location}
                onChange={handleInputChange}
                margin="normal"
                placeholder="Office, Virtual, etc."
              />
            </Grid>
            
            {/* Date and Time */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={eventFormData.is_all_day}
                    onChange={handleAllDayToggle}
                    name="is_all_day"
                    color="primary"
                  />
                }
                label="All Day Event"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={eventFormData.start_time}
                  onChange={(newValue) => handleDateChange('start_time', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.start_time,
                      helperText: formErrors.start_time,
                      margin: "normal",
                      InputProps: {
                        sx: { borderColor: theme.palette.primary.main }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={eventFormData.end_time}
                  onChange={(newValue) => handleDateChange('end_time', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.end_time,
                      helperText: formErrors.end_time,
                      margin: "normal",
                      InputProps: {
                        sx: { borderColor: theme.palette.primary.main }
                      }
                    }
                  }}
                  disabled={eventFormData.is_all_day}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Relationships */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Customer (Optional)</InputLabel>
                <Select
                  name="customer"
                  value={eventFormData.customer}
                  onChange={handleInputChange}
                  label="Customer (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Sales Opportunity (Optional)</InputLabel>
                <Select
                  name="sale"
                  value={eventFormData.sale}
                  onChange={handleInputChange}
                  label="Sales Opportunity (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {sales.map((sale) => (
                    <MenuItem key={sale.id} value={sale.id}>
                      {sale.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Participants */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="participants"
                options={users}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`.trim() || option.email}
                value={users.filter(user => eventFormData.participants.includes(user.id))}
                onChange={handleParticipantsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Participants"
                    placeholder="Add participants"
                    margin="normal"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`${option.first_name} ${option.last_name}`.trim() || option.email}
                      {...getTagProps({ index })}
                      sx={{
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        fontWeight: 500,
                        '& .MuiChip-deleteIcon': {
                          color: theme.palette.primary.contrastText,
                          opacity: 0.7,
                          '&:hover': {
                            opacity: 1
                          }
                        }
                      }}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
          {formMode === 'edit' && (
            <Button 
              onClick={handleDelete} 
              color="error" 
              startIcon={<DeleteIcon />}
              variant="outlined"
              sx={{ mr: 'auto' }}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={() => setShowEventForm(false)} 
            color="inherit"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            startIcon={formMode === 'create' ? <AddIcon /> : <EditIcon />}
          >
            {formMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Calendar; 