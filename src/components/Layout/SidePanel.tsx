import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Divider,
  Paper,
  Fade,
  Grow,
  Switch,
} from '@mui/material';
import {
  School,
  LibraryBooks,
  Work,
  LocalLibrary,
  SupervisorAccount,
  Assignment,
  Person,
  Event,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { filterLinksByRole } from '../../store/slices/linksSlice';
import { AISearchService } from '../../services/aiSearchService';

interface SidePanelProps {
  onLinkClick: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ onLinkClick }) => {
  const { filteredLinks } = useAppSelector((state) => state.links);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [aiMode, setAiMode] = React.useState<'search' | 'chat'>('search');

  React.useEffect(() => {
    const role = isAuthenticated && user ? user.role : 'guest';
    dispatch(filterLinksByRole(role));
  }, [isAuthenticated, user, dispatch]);

  // Load AI mode settings
  React.useEffect(() => {
    if (user?.role === 'staff') {
      const currentMode = AISearchService.getCurrentAIMode();
      setAiMode(currentMode);
    }
  }, [user]);

  const handleAIModeToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode: 'search' | 'chat' = event.target.checked ? 'chat' : 'search';
    setAiMode(newMode);
    AISearchService.setAIMode(newMode);

    // Sync AI mode preference to backend
    try {
      const backendService = (await import('../../services/backendService')).default;
      await backendService.updateUserSettings({ aiMode: newMode });
      console.log('✅ AI mode synced to backend:', newMode);
    } catch (error) {
      console.error('❌ Failed to sync AI mode to backend:', error);
      // Don't show error to user - local setting still works
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'School':
        return <School />;
      case 'LibraryBooks':
        return <LibraryBooks />;
      case 'Work':
        return <Work />;
      case 'LocalLibrary':
        return <LocalLibrary />;
      case 'SupervisorAccount':
        return <SupervisorAccount />;
      case 'Assignment':
        return <Assignment />;
      case 'Person':
        return <Person />;
      case 'Event':
        return <Event />;
      default:
        return <School />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'staff':
        return '#f59e0b';
      case 'student':
        return '#115740';
      default:
        return '#6b7280';
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'staff':
        return 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)';
      case 'student':
        return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
      default:
        return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
    }
  };

  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, typeof filteredLinks>);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      {/* User Profile Section - Compact */}
      <Fade in timeout={800}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Grow in timeout={1000}>
              <Avatar
                alt={user?.name || 'Guest'}
                src={user?.profileImage}
                sx={{
                  width: 48,
                  height: 48,
                  mr: 1.5,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  background: user ? getRoleGradient(user.role) : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                  color: user ? getRoleColor(user.role) : '#4b5563',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'G'}
              </Avatar>
            </Grow>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || 'Guest'}
                </Typography>
                <Chip
                  label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.7rem',
                    background: user ? getRoleGradient(user.role) : 'rgba(255,255,255,0.2)',
                    color: user ? getRoleColor(user.role) : 'white',
                    fontWeight: 'bold',
                    border: `1px solid ${user ? getRoleColor(user.role) : 'rgba(255,255,255,0.3)'}`,
                  }}
                />
              </Box>

              {user && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    display: 'block',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <StarIcon sx={{ fontSize: '0.85rem', color: '#fde047' }} />
                  {user?.role === 'staff' ? 'Enhanced' : 'Standard'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: '0.85rem', color: '#86efac' }} />
                  Active
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* AI Settings Section for Staff - Compact */}
          {user?.role === 'staff' && (
            <Fade in timeout={1200}>
              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  mt: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {aiMode === 'search' ? (
                      <SearchIcon sx={{ color: '#115740', fontSize: '1rem' }} />
                    ) : (
                      <ChatIcon sx={{ color: '#10b981', fontSize: '1rem' }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {aiMode === 'search' ? 'Search' : 'Chat'}
                    </Typography>
                  </Box>

                  <Switch
                    checked={aiMode === 'chat'}
                    onChange={handleAIModeToggle}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#10b981',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#10b981',
                        opacity: 0.7,
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#115740',
                        opacity: 0.7,
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Fade>
          )}
        </Box>
      </Fade>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 2, my: 1.5 }} />

      {/* Quick Links Section */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography
          variant="subtitle1"
          sx={{
            px: 2,
            py: 1,
            fontWeight: 'bold',
            color: 'white',
            opacity: 0.9,
            fontSize: '0.9rem'
          }}
        >
          Quick Links
        </Typography>

        <Box sx={{ overflowY: 'auto', height: '100%', pb: 2 }}>
          {Object.entries(groupedLinks).map(([category, links], categoryIndex) => (
            <Fade key={category} in timeout={1000 + categoryIndex * 200}>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    color: 'white',
                    opacity: 0.7,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600
                  }}
                >
                  {category}
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {links.map((link, linkIndex) => (
                    <Grow key={link.id} in timeout={1200 + categoryIndex * 200 + linkIndex * 100}>
                      <ListItem disablePadding sx={{ px: 1.5 }}>
                        <ListItemButton
                          onClick={() => {
                            window.open(link.url, '_blank');
                            onLinkClick();
                          }}
                          sx={{
                            borderRadius: '8px',
                            margin: '1px 0',
                            padding: '8px 12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.15)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: 'white',
                              minWidth: '32px',
                              opacity: 0.9,
                            }}
                          >
                            {getIcon(link.icon)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: 'white',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {link.title}
                              </Typography>
                            }
                            secondary={
                              link.description && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                                  {link.description}
                                </Typography>
                              )
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    </Grow>
                  ))}
                </List>
              </Box>
            </Fade>
          ))}

          {filteredLinks.length === 0 && (
            <Fade in timeout={1000}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  px: 3
                }}
              >
                <PersonIcon
                  sx={{
                    color: 'white',
                    opacity: 0.5,
                    fontSize: '4rem',
                    mb: 2
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    opacity: 0.7
                  }}
                >
                  No links available for your role.
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SidePanel;