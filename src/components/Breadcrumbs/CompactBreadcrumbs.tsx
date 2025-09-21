// Compact Breadcrumb Component
// Displays recent searches and chats as pill-style breadcrumbs below search box

import {
  Chat as ChatIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import breadcrumbService, { BreadcrumbItem } from '../../services/breadcrumbService';
import { RootState } from '../../store';

interface CompactBreadcrumbsProps {
  onSearchClick?: (query: string) => void;
  onChatClick?: (sessionId: string, title: string) => void;
  maxItems?: number;
  maxQueryLength?: number;
}

const CompactBreadcrumbs: React.FC<CompactBreadcrumbsProps> = ({
  onSearchClick,
  onChatClick,
  maxItems = 5,
  maxQueryLength = 25
}) => {
  const theme = useTheme();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;

  // Fetch breadcrumb items
  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const [searches, chats] = await Promise.all([
        breadcrumbService.getRecentSearches(maxItems),
        breadcrumbService.getRecentChats(maxItems)
      ]);

      // Merge and sort by timestamp, then limit
      const allItems = [...searches, ...chats];
      allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setItems(allItems.slice(0, maxItems));
    } catch (error) {
      console.error('Failed to fetch breadcrumb items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, maxItems]);

  // Initial load and refresh when user changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(fetchItems, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchItems]);

  // Listen for custom events for real-time updates
  useEffect(() => {
    const handleBreadcrumbSearch = () => {
      fetchItems();
    };

    const handleBreadcrumbChat = () => {
      fetchItems();
    };

    window.addEventListener('breadcrumb-search', handleBreadcrumbSearch);
    window.addEventListener('breadcrumb-chat', handleBreadcrumbChat);

    return () => {
      window.removeEventListener('breadcrumb-search', handleBreadcrumbSearch);
      window.removeEventListener('breadcrumb-chat', handleBreadcrumbChat);
    };
  }, [fetchItems]);

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = maxQueryLength): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'lesson-planning': theme.palette.success.main,
      'curriculum': theme.palette.info.main,
      'assessment': theme.palette.warning.main,
      'research': theme.palette.secondary.main,
      'resources': theme.palette.primary.main,
      'administration': theme.palette.grey[600],
      'student-support': theme.palette.error.main,
      'technology': theme.palette.success.light,
      'general': theme.palette.grey[500]
    };

    return colorMap[category] || theme.palette.grey[500];
  };

  // Handle item click
  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.type === 'search' && onSearchClick) {
      onSearchClick(item.title);
    } else if (item.type === 'chat' && onChatClick) {
      onChatClick(item.id, item.title);
    }

    // Trigger the original onClick handler
    item.onClick();
  };

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mt: 1,
        mb: 2
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          overflowX: 'auto',
          py: 1,
          px: 0.5,
          '&::-webkit-scrollbar': {
            height: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[300],
            borderRadius: 2,
          },
        }}
      >
        {/* Recent label */}
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            whiteSpace: 'nowrap',
            mr: 1,
            fontWeight: 500
          }}
        >
          Recent:
        </Typography>

        {/* Breadcrumb items */}
        {items.map((item) => (
          <Tooltip
            key={item.id}
            title={`${item.type === 'search' ? 'Search' : 'Chat'}: ${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}`}
            arrow
          >
            <Chip
              icon={item.type === 'search' ? <SearchIcon /> : <ChatIcon />}
              label={truncateText(item.title)}
              size="small"
              clickable
              onClick={() => handleItemClick(item)}
              sx={{
                minWidth: 'auto',
                maxWidth: 200,
                backgroundColor: getCategoryColor(item.category || 'general'),
                color: 'white',
                '& .MuiChip-icon': {
                  color: 'white',
                  fontSize: '0.875rem'
                },
                '& .MuiChip-label': {
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '&:hover': {
                  backgroundColor: getCategoryColor(item.category || 'general'),
                  filter: 'brightness(1.1)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[4]
                },
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </Tooltip>
        ))}

        {/* Refresh button */}
        <Tooltip title="Refresh recent items" arrow>
          <IconButton
            size="small"
            onClick={fetchItems}
            disabled={isLoading}
            sx={{
              ml: 1,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default CompactBreadcrumbs;