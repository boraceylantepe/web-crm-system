import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  CssBaseline,
  Link,
  Avatar,
  Fade,
  Slide
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Login as LoginIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const theme = useMuiTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login({ email, password });
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const gradientStyle = {
    background: isDarkMode 
      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.background.default} 50%, ${theme.palette.secondary.main} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light || '#42a5f5'} 50%, ${theme.palette.secondary.main} 100%)`,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const backgroundShapes = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '200px',
      height: '200px',
      background: isDarkMode 
        ? `${theme.palette.primary.main}20`
        : `${theme.palette.background.paper}30`,
      borderRadius: '50%',
      top: '10%',
      left: '10%',
      animation: 'float 6s ease-in-out infinite',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '150px',
      height: '150px',
      background: isDarkMode 
        ? `${theme.palette.secondary.main}15`
        : `${theme.palette.background.paper}20`,
      borderRadius: '50%',
      bottom: '20%',
      right: '15%',
      animation: 'float 8s ease-in-out infinite reverse',
    }
  };

  const glassCardStyle = {
    background: isDarkMode 
      ? `${theme.palette.background.paper}CC`
      : `${theme.palette.background.paper}E6`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${isDarkMode ? theme.palette.divider : theme.palette.primary.main}40`,
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    position: 'relative',
    zIndex: 2,
    boxShadow: isDarkMode
      ? `0 8px 32px ${theme.palette.background.default}80`
      : `0 8px 32px ${theme.palette.primary.main}30`,
  };

  return (
    <>
      <CssBaseline />
      <Box sx={gradientStyle}>
        <Box sx={backgroundShapes} />
        
        {/* Floating animation keyframes */}
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            
            .login-container {
              animation: fadeInUp 0.8s ease-out;
            }
            
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>

        <Container component="main" maxWidth="xs" className="login-container">
          <Fade in={true} timeout={1000}>
            <Paper elevation={0} sx={glassCardStyle}>
              {/* Logo Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    m: 1,
                    bgcolor: theme.palette.primary.main,
                    width: 80,
                    height: 80,
                    border: `2px solid ${theme.palette.primary.light || theme.palette.primary.main}`,
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 40, color: theme.palette.primary.contrastText }} />
                </Avatar>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 1,
                    textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : '0 2px 4px rgba(255,255,255,0.3)',
                  }}
                >
                  CRM System
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  Welcome back! Please sign in to your account
                </Typography>
              </Box>

              {error && (
                <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      '& .MuiAlert-icon': {
                        color: '#ff5252'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </Slide>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                {/* Email Field */}
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      mb: 1, 
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    Email Address *
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    placeholder="Enter your email address"
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        minHeight: '50px',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '2px solid rgba(255, 255, 255, 0.7)',
                          boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        '&::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                          fontStyle: 'normal',
                        },
                      },
                    }}
                  />
                </Box>

                {/* Password Field */}
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      mb: 1, 
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    Password *
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        minHeight: '50px',
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '2px solid rgba(255, 255, 255, 0.7)',
                          boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        '&::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                          fontStyle: 'normal',
                        },
                      },
                    }}
                  />
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  startIcon={<LoginIcon />}
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                    border: 0,
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF5252 30%, #26C6DA 90%)',
                      boxShadow: '0 6px 25px rgba(0,0,0,0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.3)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>

              
            </Paper>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

export default Login; 