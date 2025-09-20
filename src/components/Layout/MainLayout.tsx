import { Close as CloseIcon, Menu as MenuIcon } from '@mui/icons-material';
import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React from 'react';
import LoginDialog from '../Auth/LoginDialog';
import SearchSection from '../Search/SearchSection';
import SupportDialog from '../Support/SupportDialog';
import Header from './Header';
import SidePanel from './SidePanel';

const MainLayout: React.FC = () => {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogin = () => {
    setLoginOpen(true);
  };

  const handleSupport = () => {
    setSupportOpen(true);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)',
      }}
    >
      <Header onLogin={handleLogin} onSupport={handleSupport} />

      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={handleSidebarToggle}
          sx={{
            position: 'fixed',
            top: 90,
            left: 16,
            zIndex: 1300,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
            boxShadow: 3,
          }}
        >
          {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={sidebarOpen}
        onClose={handleSidebarClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 300,
            background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <SidePanel onLinkClick={handleSidebarClose} />
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', px: 2, py: 2, gap: 2 }}>
          {/* Desktop Sidebar - Fixed width */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: '320px',
              height: '100%',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                height: '100%',
                background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <SidePanel onLinkClick={() => {}} />
            </Box>
          </Box>

          {/* Search Section - Flexible width */}
          <Box
            sx={{
              flexGrow: 1,
              height: '100%',
              minWidth: 0,
            }}
          >
            <SearchSection />
          </Box>
        </Box>
      </Box>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      <SupportDialog
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;