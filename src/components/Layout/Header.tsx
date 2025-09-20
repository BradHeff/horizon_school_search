import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  Support as SupportIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { clearUser, setLoading } from '../../store/slices/authSlice';
import { AuthService } from '../../services/authService';

interface HeaderProps {
  onLogin: () => void;
  onSupport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin, onSupport }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    dispatch(setLoading(true));
    try {
      await AuthService.logout();
      dispatch(clearUser());
    } catch (error) {
      console.error('Logout failed:', error);
    }
    dispatch(setLoading(false));
    handleClose();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #667eea 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar sx={{ padding: '0 24px', height: '80px', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              component="div"
              sx={{
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Horizon Christian School
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                opacity: 0.8
              }}
            >
              Excellence in Education
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<SupportIcon />}
            onClick={onSupport}
            sx={{
              color: 'white',
              borderRadius: '12px',
              padding: '8px 16px',
              textTransform: 'none',
              fontWeight: 'bold',
              '&:hover': {
                background: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Support
          </Button>

          {isAuthenticated && user ? (
            <>
              <IconButton
                onClick={handleProfileClick}
                sx={{
                  padding: '4px',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Avatar
                  alt={user.name}
                  src={user.profileImage}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid rgba(255,255,255,0.3)',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    marginTop: '8px',
                    minWidth: '200px',
                  },
                }}
              >
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    margin: '8px',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: 'text.primary'
                    }}
                  >
                    {user.name}
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    padding: '8px 20px',
                    borderRadius: '12px',
                    margin: '0 8px',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                  >
                    {user.email}
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    padding: '8px 20px',
                    borderRadius: '12px',
                    margin: '0 8px 8px',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      textTransform: 'capitalize'
                    }}
                  >
                    Role: {user.role}
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    margin: '8px',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    color: '#dc2626',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                    },
                  }}
                >
                  <LogoutIcon sx={{ mr: 2 }} fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={onLogin}
              sx={{
                color: 'white',
                borderRadius: '12px',
                padding: '10px 20px',
                textTransform: 'none',
                fontWeight: 'bold',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;