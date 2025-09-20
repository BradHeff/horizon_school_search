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

  const handleAIModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode: 'search' | 'chat' = event.target.checked ? 'chat' : 'search';
    setAiMode(newMode);
    AISearchService.setAIMode(newMode);
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
      {/* User Profile Section */}
      <Fade in timeout={800}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Grow in timeout={1000}>
              <Avatar
                alt={user?.name || 'Guest'}
                src={user?.profileImage}
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 16px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  background: user ? getRoleGradient(user.role) : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                  color: user ? getRoleColor(user.role) : '#4b5563',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'G'}
              </Avatar>
            </Grow>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white'
              }}
            >
              {user?.name || 'Guest User'}
            </Typography>

            {user && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  opacity: 0.8
                }}
              >
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {user.email}
                </Typography>
              </Box>
            )}

            <Chip
              icon={<BadgeIcon />}
              label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
              sx={{
                background: user ? getRoleGradient(user.role) : 'rgba(255,255,255,0.2)',
                color: user ? getRoleColor(user.role) : 'white',
                fontWeight: 'bold',
                border: `2px solid ${user ? getRoleColor(user.role) : 'rgba(255,255,255,0.3)'}`,
              }}
            />
          </Box>

          {/* Stats Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mt: 3
            }}
          >
            <Paper
              elevation={0}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <StarIcon sx={{ color: '#fde047', mb: 1 }} />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'white',
                  opacity: 0.8
                }}
              >
                Access Level
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {user?.role === 'staff' ? 'Enhanced' : 'Standard'}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <TrendingUpIcon sx={{ color: '#86efac', mb: 1 }} />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'white',
                  opacity: 0.8
                }}
              >
                Status
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                Active
              </Typography>
            </Paper>
          </Box>

          {/* AI Settings Section for Staff */}
          {user?.role === 'staff' && (
            <Fade in timeout={1200}>
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: 'white',
                    opacity: 0.9
                  }}
                >
                  <SettingsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    AI Assistant Settings
                  </Typography>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {aiMode === 'search' ? (
                        <SearchIcon sx={{ color: '#115740', mr: 1, fontSize: '1.1rem' }} />
                      ) : (
                        <ChatIcon sx={{ color: '#10b981', mr: 1, fontSize: '1.1rem' }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          fontWeight: 500
                        }}
                      >
                        {aiMode === 'search' ? 'Search Mode' : 'Chat Mode'}
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

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      display: 'block',
                      lineHeight: 1.3
                    }}
                  >
                    {aiMode === 'search'
                      ? 'AI analyzes web results for educational content'
                      : 'Interactive AI assistant for teaching support'
                    }
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          )}
        </Box>
      </Fade>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 3 }} />

      {/* Quick Links Section */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography
          variant="h6"
          sx={{
            px: 3,
            py: 2,
            fontWeight: 'bold',
            color: 'white',
            opacity: 0.9,
            fontSize: '1.1rem'
          }}
        >
          Quick Links
        </Typography>

        <Box sx={{ overflowY: 'auto', height: '100%', pb: 3 }}>
          {Object.entries(groupedLinks).map(([category, links], categoryIndex) => (
            <Fade key={category} in timeout={1000 + categoryIndex * 200}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 3,
                    py: 1,
                    color: 'white',
                    opacity: 0.7,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600
                  }}
                >
                  {category}
                </Typography>
                <List dense>
                  {links.map((link, linkIndex) => (
                    <Grow key={link.id} in timeout={1200 + categoryIndex * 200 + linkIndex * 100}>
                      <ListItem disablePadding sx={{ px: 2 }}>
                        <ListItemButton
                          onClick={() => {
                            window.open(link.url, '_blank');
                            onLinkClick();
                          }}
                          sx={{
                            borderRadius: '12px',
                            margin: '2px 0',
                            padding: '12px 16px',
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
                              minWidth: '40px',
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
                                  color: 'white'
                                }}
                              >
                                {link.title}
                              </Typography>
                            }
                            secondary={
                              link.description && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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