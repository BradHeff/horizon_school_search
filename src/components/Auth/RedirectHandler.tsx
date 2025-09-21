import { Box, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { AuthService } from '../../services/authService';
import { setRememberMe, setUser } from '../../store/slices/authSlice';

const RedirectHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsProcessing(true);
        console.log('🔄 Processing authentication redirect...');
        console.log('🔄 Current URL:', window.location.href);
        console.log('🔄 URL parameters:', window.location.search);

        // Wait a bit to ensure MSAL is fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use AuthService's handleRedirectResult method
        const user = await AuthService.handleRedirectResult();

        console.log('🔄 AuthService.handleRedirectResult() returned:', user);

        if (user) {
          console.log('✅ Authentication successful:', {
            name: user.name,
            email: user.email,
            role: user.role,
            id: user.id
          });
          
          // Dispatch to Redux store
          dispatch(setUser(user));
          dispatch(setRememberMe(true)); // User went through login flow
          
          console.log('✅ User dispatched to Redux store');
          
          // Store user in localStorage to persist across navigation
          localStorage.setItem('horizon_auth_user', JSON.stringify(user));
          localStorage.setItem('horizon_auth_remember', 'true');
          
          // Brief delay to show success, then navigate
          setTimeout(() => {
            console.log('🔄 Navigating to home page...');
            navigate('/', { replace: true });
          }, 1500);
        } else {
          console.log('⚠️ No authentication result, redirecting to home');
          console.log('⚠️ This might mean MSAL handleRedirectPromise() returned null');
          
          // Check if there are any MSAL accounts
          const { msalInstance } = await import('../../config/msalConfig');
          const accounts = msalInstance.getAllAccounts();
          console.log('🔄 MSAL accounts found:', accounts.length);
          
          if (accounts.length > 0) {
            console.log('🔄 Found MSAL account, trying getCurrentUser()');
            const currentUser = await AuthService.getCurrentUser();
            if (currentUser) {
              console.log('✅ Got user from getCurrentUser():', currentUser.name);
              dispatch(setUser(currentUser));
              dispatch(setRememberMe(true));
            }
          }
          
          // Navigate after longer delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Authentication redirect error:', error);
        setError('Authentication failed. Please try again.');

        // Navigate to main page after a delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [dispatch, navigate]);

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