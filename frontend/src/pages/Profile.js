import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';

const Profile = () => {
  const { user, updateUser, refreshUserInfo } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      setProfileData(response);
      setFormData({
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        email: response.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, file: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setErrors({});
    setSuccess('');

    try {
      console.log('Starting profile update...');
      console.log('Form data:', formData);
      console.log('Selected file:', selectedFile);
      
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      
      if (selectedFile) {
        console.log('Adding file to FormData:', selectedFile.name, selectedFile.size, selectedFile.type);
        formDataToSend.append('profile_picture', selectedFile);
      }

      console.log('Sending FormData...');
      // Log FormData contents
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const response = await userService.updateProfile(formDataToSend);
      console.log('Profile update response:', response);
      
      // Update profile data first
      setProfileData(response);
      
      // Refresh user info from server to get updated profile picture URL
      console.log('Refreshing user info after profile update...');
      try {
        await refreshUserInfo();
        console.log('User info refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing user info:', refreshError);
        // Fallback: if refresh fails, try to use the response data directly
        console.log('Using profile response data as fallback');
        updateUser(response);
      }
      
      // Only clear preview state AFTER we have the server URL
      console.log('Clearing preview state after successful refresh...');
      
      // Add a small delay to ensure UI has updated with server URL
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Clear the file input
        const fileInput = document.getElementById('profile-picture-input');
        if (fileInput) fileInput.value = '';
      }, 100);
      
      setSuccess('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data) {
        console.error('Backend error response:', error.response.data);
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ general: 'Failed to update profile. Please try again.' });
        }
      } else {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeProfilePicture = async () => {
    try {
      setSaving(true);
      
      // For removing profile picture, we use the JSON method
      const response = await userService.updateProfileData({
        first_name: formData.first_name,
        last_name: formData.last_name,
        profile_picture: null
      });
      
      // Update profile data first
      setProfileData(response);
      
      // Refresh user info from server to get updated profile picture URL
      console.log('Refreshing user info after removing profile picture...');
      await refreshUserInfo();
      
      setSuccess('Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setErrors({ general: 'Failed to remove profile picture. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const getProfileImageUrl = () => {
    console.log('Getting profile image URL...');
    console.log('previewUrl:', previewUrl);
    console.log('profileData?.profile_picture_url:', profileData?.profile_picture_url);
    console.log('user?.profile_picture_url:', user?.profile_picture_url);
    
    if (previewUrl) {
      console.log('Using preview URL:', previewUrl);
      return previewUrl;
    }
    
    let imageUrl = null;
    
    if (profileData?.profile_picture_url) {
      imageUrl = profileData.profile_picture_url;
      console.log('Found profileData URL:', imageUrl);
    } else if (user?.profile_picture_url) {
      imageUrl = user.profile_picture_url;
      console.log('Found user URL:', imageUrl);
    }
    
    if (imageUrl) {
      // Convert relative URL to absolute URL if needed
      if (imageUrl.startsWith('/media/')) {
        imageUrl = `http://localhost:8000${imageUrl}`;
        console.log('Converted to absolute URL:', imageUrl);
      }
      
      // Add cache buster to prevent browser caching issues
      const finalUrl = imageUrl.includes('?') ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;
      console.log('Final URL with cache buster:', finalUrl);
      return finalUrl;
    }
    
    console.log('No profile picture URL found');
    return null;
  };

  const getAvatarContent = () => {
    const imageUrl = getProfileImageUrl();
    if (imageUrl) {
      return <Avatar sx={{ width: 120, height: 120 }} src={imageUrl} />;
    }
    return (
      <Avatar sx={{ width: 120, height: 120, fontSize: '3rem' }}>
        {(formData.first_name?.[0] || formData.last_name?.[0] || formData.email?.[0] || 'U').toUpperCase()}
      </Avatar>
    );
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 3 }}>
        My Profile
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Picture Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Profile Picture
              </Typography>
              
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                {getAvatarContent()}
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      component="label"
                      size="small"
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' }
                      }}
                    >
                      <PhotoCameraIcon fontSize="small" />
                      <input
                        id="profile-picture-input"
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </IconButton>
                  }
                />
              </Box>

              {errors.file && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.file}
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the camera icon to upload a new profile picture
              </Typography>

              {(profileData?.profile_picture_url || previewUrl) && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={removeProfilePicture}
                  disabled={saving}
                >
                  Remove Picture
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <form onSubmit={handleProfileUpdate}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    error={!!errors.first_name}
                    helperText={errors.first_name}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    error={!!errors.last_name}
                    helperText={errors.last_name}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    disabled
                    helperText="Email address cannot be changed"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 