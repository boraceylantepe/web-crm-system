import React, { useState, useContext } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Check as CheckIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const PasswordChange = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  
  const { changePassword } = useContext(AuthContext);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // If updating the new password, check password strength
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };
  
  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&.]/.test(password),
    });
  };
  
  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(Boolean);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isPasswordValid()) {
      setError('Password does not meet all the requirements.');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (result.success) {
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Close the dialog
        onClose();
      } else {
        // Format error messages
        if (typeof result.error === 'object') {
          const errorMessages = Object.entries(result.error)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(result.error || 'Password change failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const PasswordRequirement = ({ met, text }) => (
    <ListItem dense>
      <ListItemIcon sx={{ minWidth: 30 }}>
        {met ? (
          <CheckIcon sx={{ color: 'success.main' }} fontSize="small" />
        ) : (
          <CloseIcon sx={{ color: 'error.main' }} fontSize="small" />
        )}
      </ListItemIcon>
      <ListItemText 
        primary={text} 
        primaryTypographyProps={{ 
          variant: 'body2', 
          color: met ? 'success.main' : 'error.main'
        }} 
      />
    </ListItem>
  );
  
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" paragraph color="text.secondary">
          For security reasons, your password must be changed. Please enter a new password that meets all the requirements.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Current Password"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            error={formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword}
            helperText={
              formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword
                ? "Passwords don't match"
                : ""
            }
          />
        </form>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Password Requirements:
          </Typography>
          <List dense>
            <PasswordRequirement 
              met={passwordStrength.length} 
              text="At least 8 characters long" 
            />
            <PasswordRequirement 
              met={passwordStrength.lowercase} 
              text="At least one lowercase letter (a-z)" 
            />
            <PasswordRequirement 
              met={passwordStrength.uppercase} 
              text="At least one uppercase letter (A-Z)" 
            />
            <PasswordRequirement 
              met={passwordStrength.number} 
              text="At least one number (0-9)" 
            />
            <PasswordRequirement 
              met={passwordStrength.special} 
              text="At least one special character (@$!%*?&.)" 
            />
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !isPasswordValid() || formData.newPassword !== formData.confirmPassword}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChange; 