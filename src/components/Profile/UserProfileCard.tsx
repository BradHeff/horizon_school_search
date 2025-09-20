import React from 'react';
import {
  Paper,
  Avatar,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

const UserProfileCard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return (
      <Paper elevation={2} className="p-4">
        <Box className="text-center">
          <Avatar className="mx-auto mb-3 w-16 h-16 bg-gray-300">
            <PersonIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" className="text-gray-700 mb-2">
            Guest User
          </Typography>
          <Typography variant="body2" className="text-gray-600 mb-3">
            Log in to access personalized features
          </Typography>
          <Chip
            label="Guest"
            color="default"
            variant="outlined"
            size="small"
          />
        </Box>
      </Paper>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'staff':
        return 'warning';
      case 'student':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'staff':
        return 'Teaching tools & analytics';
      case 'student':
        return 'Student resources';
      default:
        return 'Basic access';
    }
  };

  return (
    <Paper elevation={2} className="p-4">
      <Box className="text-center">
        <Avatar
          alt={user.name}
          src={user.profileImage}
          className="mx-auto mb-3 w-16 h-16"
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>

        <Typography variant="h6" className="text-gray-800 mb-1 font-medium">
          {user.name}
        </Typography>

        <Box className="flex items-center justify-center mb-2">
          <EmailIcon fontSize="small" className="text-gray-500 mr-1" />
          <Typography variant="body2" className="text-gray-600">
            {user.email}
          </Typography>
        </Box>

        <Chip
          icon={<BadgeIcon />}
          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          color={getRoleColor(user.role) as any}
          variant="filled"
          size="small"
          className="mb-2"
        />

        <Typography variant="caption" className="block text-gray-500 mb-3">
          {getRoleDescription(user.role)}
        </Typography>

        <Box className="grid grid-cols-2 gap-2 text-center">
          <Box className="bg-blue-50 rounded-lg p-2">
            <Typography variant="caption" className="block text-blue-600 font-medium">
              Access Level
            </Typography>
            <Typography variant="body2" className="text-blue-800 capitalize">
              {user.role}
            </Typography>
          </Box>
          <Box className="bg-green-50 rounded-lg p-2">
            <Typography variant="caption" className="block text-green-600 font-medium">
              Status
            </Typography>
            <Typography variant="body2" className="text-green-800">
              Active
            </Typography>
          </Box>
        </Box>

        {user.role === 'staff' ? (
          <Box className="mt-3">
            <Typography variant="caption" className="block text-gray-600 mb-1">
              AI Teaching Assistant Available
            </Typography>
            <Box className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <Typography variant="caption" className="text-green-600">
                Enhanced Features Enabled
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box className="mt-3">
            <Typography variant="caption" className="block text-gray-600 mb-1">
              Student Resources
            </Typography>
            <Box className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <Typography variant="caption" className="text-blue-600">
                Study Tools Available
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UserProfileCard;