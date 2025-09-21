// Breadcrumb Component
// Displays recent searches and chats as clickable breadcrumbs

import {
    Chat as ChatIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    History as HistoryIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import breadcrumbService, { BreadcrumbItem } from '../../services/breadcrumbService';
import { RootState } from '../../store';

interface BreadcrumbSectionProps {
  title: string;
  items: BreadcrumbItem[];
  icon: React.ReactNode;
  emptyMessage: string;
  maxVisible?: number;
}

const BreadcrumbSection: React.FC<BreadcrumbSectionProps> = ({
  title,
  items,
  icon,
  emptyMessage,
  maxVisible = 5
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  if (items.length === 0) {
    return (
      <Box sx={{ 
        py: 1, 
        px: 2, 
        backgroundColor: alpha(theme.palette.grey[100], 0.5),
        borderRadius: 1,
        border: `1px dashed ${theme.palette.grey[300]}`
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
          {title} ({items.length})
        </Typography>
        {hasMore && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ ml: 'auto' }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        {visibleItems.map((item) => (
          <Tooltip
            key={item.id}
            title={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <Typography variant="caption" color="inherit">
                    {item.subtitle}
                  </Typography>
                )}
                <Typography variant="caption" color="inherit">
                  {breadcrumbService.formatTimeAgo(item.timestamp)}
                </Typography>
              </Box>
            }
            arrow
            placement="top"
          >
            <Chip
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {item.category && (
                    <Box component="span" sx={{ fontSize: '0.75rem' }}>
                      {breadcrumbService.getCategoryIcon(item.category)}
                    </Box>
                  )}
                  <Box component="span" sx={{ 
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title}
                  </Box>
                </Stack>
              }
              size="small"
              variant={hoveredItem === item.id ? "filled" : "outlined"}
              clickable
              onClick={item.onClick}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              sx={{
                borderColor: item.category ? 
                  breadcrumbService.getCategoryColor(item.category) : 
                  theme.palette.primary.main,
                color: hoveredItem === item.id ? 'white' : 
                  (item.category ? 
                    breadcrumbService.getCategoryColor(item.category) : 
                    theme.palette.primary.main),
                backgroundColor: hoveredItem === item.id ? 
                  (item.category ? 
                    breadcrumbService.getCategoryColor(item.category) : 
                    theme.palette.primary.main) : 
                  'transparent',
                '&:hover': {
                  backgroundColor: item.category ? 
                    breadcrumbService.getCategoryColor(item.category) : 
                    theme.palette.primary.main,
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[4]
                },
                transition: 'all 0.2s ease-in-out'
              }}
            />
          </Tooltip>
        ))}
      </Stack>

      {hasMore && !expanded && (
        <Typography
          variant="caption"
          color="primary"
          sx={{ 
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => setExpanded(true)}
        >
          +{items.length - maxVisible} more
        </Typography>
      )}
    </Box>
  );
};

interface BreadcrumbsProps {
  showSearches?: boolean;
  showChats?: boolean;
  maxItems?: number;
  compact?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  showSearches = true,
  showChats = true,
  maxItems = 5,
  compact = false
}) => {
  const theme = useTheme();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [recentSearches, setRecentSearches] = useState<BreadcrumbItem[]>([]);
  const [recentChats, setRecentChats] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const renderCountRef = useRef(0);
  const mountedRef = useRef(true);

  const showChatSection = showChats && user?.settings?.chatEnabled;

  const loadRecentItems = useCallback(async (force = false) => {
    // Prevent concurrent loads using ref
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    try {
      if (force) {
        await breadcrumbService.refreshData();
      }

      const [searches, chats] = await Promise.all([
        showSearches ? breadcrumbService.getRecentSearches(maxItems) : Promise.resolve([]),
        showChatSection ? breadcrumbService.getRecentChats(maxItems) : Promise.resolve([])
      ]);

      setRecentSearches(searches);
      setRecentChats(chats);
      
      console.log('📋 Breadcrumbs loaded:', { 
        searches: searches.length, 
        chats: chats.length 
      });
    } catch (error) {
      console.error('Failed to load breadcrumb items:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [showSearches, showChatSection, maxItems]);

  useEffect(() => {
    // Component mount/unmount tracking
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Increment render count and prevent runaway renders
      renderCountRef.current += 1;
      if (renderCountRef.current > 10) {
        console.error('🚨 Breadcrumbs: Too many renders, stopping');
        return;
      }

      if (isAuthenticated && mountedRef.current) {
        // Prevent concurrent loads using ref
        if (loadingRef.current) return;
        
        loadingRef.current = true;
        setLoading(true);
        
        // Add delay to prevent initial loading rush
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if still mounted after delay
        if (!mountedRef.current) return;
        
        try {
          const [searches, chats] = await Promise.all([
            showSearches ? breadcrumbService.getRecentSearches(maxItems).catch(() => []) : Promise.resolve([]),
            showChatSection ? breadcrumbService.getRecentChats(maxItems).catch(() => []) : Promise.resolve([])
          ]);

          // Check if still mounted before setting state
          if (mountedRef.current) {
            setRecentSearches(searches || []);
            setRecentChats(chats || []);
            
            console.log('📋 Breadcrumbs loaded:', { 
              searches: (searches || []).length, 
              chats: (chats || []).length 
            });
          }
        } catch (error) {
          console.error('Failed to load breadcrumb items:', error);
          if (mountedRef.current) {
            setRecentSearches([]);
            setRecentChats([]);
          }
        } finally {
          if (mountedRef.current) {
            loadingRef.current = false;
            setLoading(false);
          }
        }
      } else {
        // Clear data when not authenticated
        setRecentSearches([]);  
        setRecentChats([]);
        setLoading(false);
        loadingRef.current = false;
      }
    };

    // Only load if component is mounted and dependencies have stabilized
    const timeoutId = setTimeout(loadData, 100);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user?.settings?.chatEnabled, showSearches, showChatSection, maxItems]);

  // Listen for breadcrumb events
  useEffect(() => {
    const handleBreadcrumbSearch = (event: CustomEvent) => {
      console.log('🔍 Breadcrumb search triggered:', event.detail);
      // This will be handled by the SearchSection component
    };

    const handleBreadcrumbChat = (event: CustomEvent) => {
      console.log('💬 Breadcrumb chat triggered:', event.detail);
      // This will be handled by the chat components
    };

    window.addEventListener('breadcrumb-search', handleBreadcrumbSearch as EventListener);
    window.addEventListener('breadcrumb-chat', handleBreadcrumbChat as EventListener);

    return () => {
      window.removeEventListener('breadcrumb-search', handleBreadcrumbSearch as EventListener);
      window.removeEventListener('breadcrumb-chat', handleBreadcrumbChat as EventListener);
    };
  }, []);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const hasAnyItems = recentSearches.length > 0 || recentChats.length > 0;

  // Don't render if no items and not loading (but allow initial loading state)
  if (!hasAnyItems && !loading) {
    return null;
  }

  // Prevent rendering if we're in an unstable state
  if (loadingRef.current && loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading recent activity...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(10px)',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      borderRadius: 2,
      p: compact ? 1.5 : 2,
      mb: 2,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" color="primary" fontWeight={600}>
            Recent Activity
          </Typography>
        </Stack>
        
        <Tooltip title="Refresh recent items">
          <IconButton
            size="small"
            onClick={() => loadRecentItems(true)}
            disabled={loading}
            sx={{
              opacity: loading ? 0.5 : 1,
              transform: loading ? 'rotate(360deg)' : 'none',
              transition: 'all 0.5s ease-in-out'
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Content */}
      <Stack spacing={2}>
        {showSearches && (
          <BreadcrumbSection
            title="Recent Searches"
            items={recentSearches}
            icon={<SearchIcon color="primary" />}
            emptyMessage="No recent searches"
            maxVisible={maxItems}
          />
        )}

        {showChatSection && (
          <BreadcrumbSection
            title="Recent Chats"
            items={recentChats}
            icon={<ChatIcon color="secondary" />}
            emptyMessage="No recent chats"
            maxVisible={maxItems}
          />
        )}
      </Stack>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Loading recent activity...
          </Typography>
        </Box>
      )}

      {/* Decorative gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          borderRadius: '2px 2px 0 0'
        }}
      />
    </Box>
  );
};

export default Breadcrumbs;