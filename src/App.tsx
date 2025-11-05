import { MsalProvider } from '@azure/msal-react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import RedirectHandler from './components/Auth/RedirectHandler';
import MainLayout from './components/Layout/MainLayout';
import { getMsalInstance, initializeMSAL } from './config/msalConfig';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import AdminPage from './pages/AdminPage';
import { AuthService } from './services/authService';
import { store } from './store';
import { setLoading, setRememberMe, setUser } from './store/slices/authSlice';
// Add this button component to your app to test Sentry's error tracking

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

// Staff-only route wrapper
const StaffRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  // Wait for authentication to finish loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Admin-only route wrapper (SG_WF_Staff or SG_WF_IT group members)
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Wait for authentication to finish loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log('⚠️ AdminRoute: Not authenticated');
    return <Navigate to="/" replace />;
  }

  // Check if user is admin
  // Allow admin access to:
  // 1. Users with isAdmin flag (from backend)
  // 2. Members of SG_WF_Staff or SG_WF_IT groups
  // 3. All users with 'staff' role (standard staff)
  const isAdmin =
    user.isAdmin ||
    (user.groups &&
      (user.groups.includes('SG_WF_Staff') || user.groups.includes('SG_WF_IT'))) ||
    user.role === 'staff';

  if (!isAdmin) {
    console.log('⚠️ AdminRoute: User is not admin');
    console.log('User groups:', user.groups);
    console.log('User role:', user.role);
    console.log('User isAdmin:', user.isAdmin);
    return <Navigate to="/" replace />;
  }

  console.log('✅ AdminRoute: Access granted');
  return children;
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize MSAL first
        await initializeMSAL();

        // Handle MSAL redirects at root level (since Microsoft redirects to '/' not '/redirect')
        const msalInstance = await getMsalInstance();
        const redirectResult = await msalInstance.handleRedirectPromise();

        if (redirectResult && redirectResult.account) {
          console.log('🔄 Processing MSAL redirect result at root level');
          const user = await AuthService.handleRedirectResult();
          if (user) {
            console.log('✅ MSAL redirect processed successfully:', user.name);
            dispatch(setUser(user));
            dispatch(setRememberMe(true));
            return;
          }
        }

        // Only handle auto-login in main app, not redirect results
        // Redirect results are handled by RedirectHandler component OR above MSAL redirect logic
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
      } finally {
        // Clear loading state
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/redirect" element={<RedirectHandler />} />
        <Route path="/" element={<MainLayout />} />
        <Route
          path="/analytics"
          element={
            <StaffRoute>
              <MainLayout page="analytics" />
            </StaffRoute>
          }
        />
        <Route
          path="/moderation"
          element={
            <StaffRoute>
              <MainLayout page="moderation" />
            </StaffRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
};

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [msalInstance, setMsalInstance] = React.useState<any>(null);

  React.useEffect(() => {
    const initializeMsal = async () => {
      try {
        await initializeMSAL();
        const instance = await getMsalInstance();
        setMsalInstance(instance);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        setIsInitialized(true); // Continue with fallback
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized || !msalInstance) {
    return <div>Loading authentication...</div>;
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
