import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Box,
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
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { filterLinksByRole } from '../../store/slices/linksSlice';

const QuickLinksSection: React.FC = () => {
  const { filteredLinks } = useAppSelector((state) => state.links);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const role = isAuthenticated && user ? user.role : 'guest';
    dispatch(filterLinksByRole(role));
  }, [isAuthenticated, user, dispatch]);

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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'primary';
      case 'learning':
        return 'secondary';
      case 'productivity':
        return 'success';
      case 'resources':
        return 'info';
      case 'staff':
        return 'warning';
      case 'student':
        return 'error';
      default:
        return 'default';
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
    <Paper elevation={2} className="flex-1 overflow-hidden">
      <Box className="p-4 border-b">
        <Typography variant="h6" className="font-bold text-gray-800">
          Quick Links
        </Typography>
        {isAuthenticated && user && (
          <Typography variant="body2" className="text-gray-600">
            Personalized for {user.role}s
          </Typography>
        )}
      </Box>

      <Box className="h-full overflow-y-auto pb-16">
        {Object.entries(groupedLinks).map(([category, links]) => (
          <Box key={category} className="mb-4">
            <Typography
              variant="subtitle2"
              className="px-4 py-2 bg-gray-50 font-medium text-gray-700"
            >
              {category}
            </Typography>
            <List dense>
              {links.map((link) => (
                <ListItem key={link.id} disablePadding>
                  <ListItemButton
                    onClick={() => window.open(link.url, '_blank')}
                    className="py-2"
                  >
                    <ListItemIcon className="min-w-0 mr-3">
                      {getIcon(link.icon)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box className="flex items-center justify-between">
                          <Typography variant="body2" className="font-medium">
                            {link.title}
                          </Typography>
                          <Chip
                            label={category}
                            size="small"
                            color={getCategoryColor(category) as any}
                            variant="outlined"
                            className="ml-2"
                          />
                        </Box>
                      }
                      secondary={
                        link.description && (
                          <Typography variant="caption" className="text-gray-600">
                            {link.description}
                          </Typography>
                        )
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        {filteredLinks.length === 0 && (
          <Box className="text-center py-8">
            <Typography variant="body2" className="text-gray-600">
              No links available for your role.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default QuickLinksSection;