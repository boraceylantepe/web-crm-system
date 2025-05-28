/**
 * Format a date string to DD/MM/YYYY format
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  try {
    // Parse the date string
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Invalid date';
    }
    
    // Format the date
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date and time string to DD/MM/YYYY HH:MM format
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date and time
 */
export const formatDateTime = (dateString) => {
  // Debug the date string format being received
  console.log('formatDateTime received:', dateString, typeof dateString);
  
  if (!dateString) return 'Not set';
  
  try {
    // Parse the date string
    // If dateString is in "DD/MM/YYYY HH:MM" format, convert it to standard ISO format
    let date;
    if (typeof dateString === 'string' && dateString.includes('/')) {
      // Handle DD/MM/YYYY HH:MM format (from Django serializer)
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      const isoDateString = `${year}-${month}-${day}T${timePart}:00`;
      console.log('Converting to ISO format:', isoDateString);
      date = new Date(isoDateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid datetime:', dateString);
      return 'Invalid date';
    }
    
    // Debug the parsed date
    console.log('Parsed date object:', date);
    
    // Format the date and time
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error, dateString);
    return 'Invalid date';
  }
}; 