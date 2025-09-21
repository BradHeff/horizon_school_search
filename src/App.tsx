import { MsalProvider } from '@azure/msal-react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import RedirectHandler from './components/Auth/RedirectHandler';
import MainLayout from './components/Layout/MainLayout';
import { initializeMSAL, msalInstance } from './config/msalConfig';
import { useAppDispatch } from './hooks/redux';
import { AuthService } from './services/authService';
import { store } from './store';
import { setRememberMe, setUser } from './store/slices/authSlice';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ffc107',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize MSAL first
        await initializeMSAL();

        // Only handle auto-login in main app, not redirect results
        // Redirect results are handled by RedirectHandler component
        if (window.location.pathname !== '/redirect') {
          // First check if we have a user from redirect in localStorage
          const redirectUser = localStorage.getItem('horizon_auth_user');
          const redirectRemember = localStorage.getItem('horizon_auth_remember');
          
          if (redirectUser && redirectRemember) {
            try {
              const user = JSON.parse(redirectUser);
              console.log('✅ Found redirect user in localStorage:', user.name);
              dispatch(setUser(user));
              dispatch(setRememberMe(true));
              
              // Clear the temporary storage
              localStorage.removeItem('horizon_auth_user');
              localStorage.removeItem('horizon_auth_remember');
              return;
            } catch (error) {
              console.error('Failed to parse redirect user from localStorage:', error);
              localStorage.removeItem('horizon_auth_user');
              localStorage.removeItem('horizon_auth_remember');
            }
          }
          
          // Check for auto-login (backend or cookie-based)
          const autoLoginUser = await AuthService.checkAutoLogin();
          if (autoLoginUser) {
            dispatch(setUser(autoLoginUser));
            dispatch(setRememberMe(autoLoginUser.settings?.rememberMe || false));
            console.log('✅ Auto-login successful');
          } else if (AuthService.shouldRememberUser()) {
            dispatch(setRememberMe(true));
            const user = await AuthService.getCurrentUser();
            if (user) {
              dispatch(setUser(user));
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
      }
    };

    initializeAuth();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/redirect" element={<RedirectHandler />} />
        <Route path="/" element={<MainLayout />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
};

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeMsal = async () => {
      try {
        await initializeMSAL();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        setIsInitialized(true); // Continue with fallback
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Provider store={store}>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </MsalProvider>
    </Provider>
  );
}

export default App;
