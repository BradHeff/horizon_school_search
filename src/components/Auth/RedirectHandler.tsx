import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { useAppDispatch } from '../../hooks/redux';
import { setUser } from '../../store/slices/authSlice';
import { AuthService } from '../../services/authService';

const RedirectHandler: React.FC = () => {
  const { instance } = useMsal();
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsProcessing(true);

        // Handle the redirect response
        const response = await instance.handleRedirectPromise();

        if (response) {
          // Login successful
          const user = await AuthService.getCurrentUser();
          if (user) {
            dispatch(setUser(user));
          }

          // Redirect to main page
          window.location.replace('/');
        } else {
          // No response or already handled
          window.location.replace('/');
        }
      } catch (error) {
        console.error('Authentication redirect error:', error);
        setError('Authentication failed. Please try again.');

        // Redirect to main page after a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [instance, dispatch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        background: 'linear-gradient(135deg, #115740 0%, #22a06b 100%)',
        color: 'white'
      }}
    >
      {isProcessing ? (
        <>
          <CircularProgress
            size={60}
            sx={{
              color: 'white',
              mb: 3
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Signing you in...
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, textAlign: 'center' }}>
            Please wait while we complete your authentication.
          </Typography>
        </>
      ) : error ? (
        <>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#ff6b6b' }}>
            Authentication Error
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, textAlign: 'center', mb: 2 }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.6, textAlign: 'center' }}>
            Redirecting you back to the main page...
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Authentication Complete
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, textAlign: 'center' }}>
            Redirecting you to the main page...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default RedirectHandler;