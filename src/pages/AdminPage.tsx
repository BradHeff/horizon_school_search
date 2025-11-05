import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Link as LinkIcon,
  Shield as ShieldIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import QuickLinksManager from '../components/Admin/QuickLinksManager';
import ModerationPanel from '../components/Moderation/ModerationPanel';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and admin access
    if (!isAuthenticated || !user) {
      console.log('⚠️ Not authenticated, redirecting to home');
      navigate('/');
      return;
    }

    // Check if user is admin
    const isAdmin =
      user.isAdmin ||
      (user.groups &&
        (user.groups.includes('SG_WF_Staff') || user.groups.includes('SG_WF_IT'))) ||
      user.role === 'staff';

    if (!isAdmin) {
      console.log('⚠️ Not admin, redirecting to home');
      console.log('User groups:', user.groups);
      navigate('/');
      return;
    }

    console.log('✅ Admin access granted');
    setLoading(false);
  }, [isAuthenticated, user, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Verifying admin access...
        </Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Card */}
        <Card
          elevation={8}
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  border: '3px solid white',
                }}
              >
                <DashboardIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" component="h1" fontWeight="bold">
                  Admin Dashboard
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Horizon School Search Management Portal
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            {/* Admin Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonIcon />}
                label={user?.name || 'Unknown'}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'medium',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
              <Chip
                label={user?.email || ''}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                }}
              />
              <Chip
                label={`Role: ${user?.role?.toUpperCase()}`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
              {user?.groups && user.groups.includes('SG_WF_IT') && (
                <Chip
                  label="IT Administrator"
                  sx={{
                    bgcolor: '#4caf50',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card elevation={8} sx={{ borderRadius: 3 }}>
          {/* Tabs */}
          <Paper
            elevation={0}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              background: 'linear-gradient(to right, #f5f5f5, #fafafa)',
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="admin tabs"
              sx={{
                px: 2,
                '& .MuiTab-root': {
                  minHeight: 72,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#1976d2',
                    fontWeight: 700,
                  },
                },
              }}
            >
              <Tab icon={<LinkIcon />} iconPosition="start" label="Quick Links" />
              <Tab icon={<ShieldIcon />} iconPosition="start" label="Content Moderation" />
              <Tab icon={<BarChartIcon />} iconPosition="start" label="Analytics" />
              <Tab icon={<SettingsIcon />} iconPosition="start" label="System Settings" disabled />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <Box sx={{ minHeight: 600 }}>
            <TabPanel value={currentTab} index={0}>
              <QuickLinksManager />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <ModerationPanel userRole={user?.role || 'guest'} />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <AnalyticsDashboard userRole={user?.role || 'guest'} />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <SettingsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  System Settings
                </Typography>
                <Typography color="text.secondary">
                  Advanced system configuration options coming soon...
                </Typography>
              </Box>
            </TabPanel>
          </Box>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
            Horizon School Search Admin Portal &copy; {new Date().getFullYear()}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPage;
