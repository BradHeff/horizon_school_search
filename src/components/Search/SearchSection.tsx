import {
    Analytics,
    Assignment,
    Chat as ChatIcon,
    History,
    Lightbulb as IdeaIcon,
    LibraryBooks,
    AutoAwesome as MagicIcon,
    School,
    Search as SearchIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Fade,
    Grid,
    Grow,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Slide,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useDebounce, useRequestDeduplication } from '../../hooks/useDebounce';
import type { ChatMessage } from '../../services/aiSearchService';
import { AISearchService } from '../../services/aiSearchService';
import { WebSearchService } from '../../services/webSearchService';
import { addToHistory, setAIAnswer, setError, setGeneratingAnswer, setLoading, setQuery, setResults } from '../../store/slices/searchSlice';
import BreadcrumbErrorBoundary from '../Breadcrumbs/BreadcrumbErrorBoundary';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import CompactBreadcrumbs from '../Breadcrumbs/CompactBreadcrumbs';
import AIInstantAnswerComponent from './AIInstantAnswer';
import LoadingSkeleton from './LoadingSkeleton';

const SearchSection: React.FC = () => {
  const { query, results, aiAnswer, isLoading, isGeneratingAnswer, error, searchHistory } = useAppSelector((state) => state.search);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Debouncing and request deduplication
  const debouncedQuery = useDebounce(query, 1500); // 1.5 second debounce for search
  const { executeRequest, isRequestPending } = useRequestDeduplication();
  const [isTyping, setIsTyping] = React.useState(false);
  const [aiMode, setAiMode] = React.useState<'search' | 'chat'>('search');
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatResponse, setChatResponse] = React.useState<string>('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [isChatLoading, setIsChatLoading] = React.useState(false);

  // Sync AI mode with user settings
  React.useEffect(() => {
    if (user?.role === 'staff' && AISearchService.canUseChat(user.role)) {
      setAiMode(AISearchService.getCurrentAIMode());
      
      // Subscribe to AI mode changes
      const unsubscribe = AISearchService.onModeChange((newMode) => {
        setAiMode(newMode);
        // Clear any existing content when switching modes
        dispatch(setResults([]));
        setChatResponse('');
        setChatMessages([]);
      });

      // Clean up subscription on unmount
      return unsubscribe;
    }
  }, [user, dispatch]);

  // Create a ref to store the latest performSearch function
  const performSearchRef = React.useRef<((query: string) => Promise<void>) | null>(null);

  // Listen for breadcrumb search events
  React.useEffect(() => {
    const handleBreadcrumbSearch = (event: CustomEvent) => {
      const { query: searchQuery, searchId, category } = event.detail;
      console.log('🔍 Breadcrumb search triggered:', { searchQuery, searchId, category });
      
      // Set the query in the input
      dispatch(setQuery(searchQuery));
      
      // Perform the search using the ref
      if (searchQuery.trim() && performSearchRef.current) {
        performSearchRef.current(searchQuery.trim());
      }
    };

    window.addEventListener('breadcrumb-search', handleBreadcrumbSearch as EventListener);

    return () => {
      window.removeEventListener('breadcrumb-search', handleBreadcrumbSearch as EventListener);
    };
  }, [dispatch]);

  // Update the performSearch ref whenever the function changes
  React.useEffect(() => {
    performSearchRef.current = performSearch;
  });

  // Debounced search effect - triggers search when user stops typing
  React.useEffect(() => {
    if (aiMode === 'search' && debouncedQuery && debouncedQuery.trim().length >= 3 && !isRequestPending(debouncedQuery.trim())) {
      setIsTyping(false);
      performSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, aiMode]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    dispatch(setQuery(newQuery));

    // Only perform real-time search in search mode, not in chat mode
    if (aiMode === 'search') {
      const trimmedQuery = newQuery.trim();

      // Clear results and AI answer immediately when typing
      dispatch(setResults([]));
      dispatch(setAIAnswer(null));

      // Set typing state for queries longer than 2 characters
      if (trimmedQuery.length >= 3) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    } else {
      // In chat mode, clear results when typing but don't search
      if (!newQuery.trim()) {
        setChatResponse('');
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query.trim()) {
      event.preventDefault();

      const trimmedQuery = query.trim();

      // Check if request is already pending
      if (isRequestPending(trimmedQuery) || isLoading || isChatLoading) {
        console.log('🚫 Ignoring Enter key - request already in progress');
        return;
      }

      if (aiMode === 'chat' && user?.role === 'staff') {
        handleChatMessage(trimmedQuery);
      } else {
        performSearch(trimmedQuery);
      }
    }
  };

  const performSearch = async (searchQuery: string) => {
    const requestKey = `search:${searchQuery}`;

    // Use request deduplication to prevent duplicate searches
    const result = await executeRequest(requestKey, async () => {
      // Clear typing state immediately when search starts
      setIsTyping(false);
      setIsSearching(true);
      dispatch(setLoading(true));
      dispatch(addToHistory(searchQuery));
      setChatResponse('');

      try {
        const userRole = isAuthenticated && user ? user.role : 'guest';
        const results = await AISearchService.performSearch(searchQuery, userRole);
        dispatch(setResults(results));

        return results;
      } catch (error) {
        console.error('❌ Search error:', error);
        dispatch(setError('Search failed. Please try again.'));
        throw error;
      } finally {
        dispatch(setLoading(false));
        setIsSearching(false);
      }
    });

    if (result === null) {
      // Request was deduplicated, search is already running
      return;
    }

    // Generate AI instant answer after getting results
    let generatedAnswer: any = null;
    if (result && result.length > 0) {
      dispatch(setGeneratingAnswer(true));
      try {
        const userRole = isAuthenticated && user ? user.role : 'guest';
        const aiAnswer = await WebSearchService.generateInstantAnswer(searchQuery, result, userRole);
        if (aiAnswer) {
          generatedAnswer = aiAnswer;
          dispatch(setAIAnswer(aiAnswer));
        }
      } catch (aiErr) {
        console.warn('⚠️ AI instant answer generation failed:', aiErr);
        // Don't show error to user, just skip the AI answer
      } finally {
        dispatch(setGeneratingAnswer(false));
      }
    }

    // NEW: Rate content and check triggers (staff can see this in analytics)
    if (isAuthenticated && result && result.length > 0) {
      try {
        const backendService = (await import('../../services/backendService')).default;

        // Rate the content
        const rating = await backendService.rateContent(
          searchQuery,
          result,
          generatedAnswer || undefined
        );

        if (rating) {
          console.log('📊 Content rated:', {
            score: rating.score,
            trigger: rating.trigger,
            reasons: rating.reasons.length
          });

          // Log warning for inappropriate content
          if (rating.trigger === 'bad') {
            console.warn('⚠️ Content flagged as inappropriate:', rating.reasons);
          } else if (rating.trigger === 'questionable') {
            console.warn('⚠️ Content flagged as questionable:', rating.reasons);
          }

          // Note: We don't block content here, just log it
          // Staff can review flagged searches in the Analytics dashboard
          // This allows educational oversight without disrupting student searches
        }
      } catch (ratingError) {
        console.error('Failed to rate content:', ratingError);
        // Don't fail the search if rating fails
      }
    }
  };

  const handleChatMessage = async (message: string) => {
    setIsChatLoading(true);
    dispatch(addToHistory(message));
    dispatch(setResults([]));
    dispatch(setQuery('')); // Clear the input after sending chat message

    try {
      const newMessages: ChatMessage[] = [
        ...chatMessages,
        { role: 'user', content: message }
      ];
      setChatMessages(newMessages);

      const response = await AISearchService.chatWithAI(newMessages);
      setChatResponse(response);

      setChatMessages([
        ...newMessages,
        { role: 'assistant', content: response }
      ]);
    } catch (err) {
      dispatch(setError('Chat failed. Please try again.'));
    } finally {
      setIsChatLoading(false);
    }
  };

  const getSearchPlaceholder = () => {
    if (user?.role === 'staff' && aiMode === 'chat') {
      return 'Type your question and press Enter to chat with AI assistant...';
    } else if (!isAuthenticated) {
      return 'Search school information...';
    } else if (user?.role === 'staff') {
      return 'Search teaching resources, create rubrics, lesson plans...';
    } else {
      return 'Search assignments, study materials, resources...';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'assignments':
        return <Assignment />;
      case 'study materials':
        return <LibraryBooks />;
      case 'teaching resources':
        return <School />;
      case 'analytics':
        return <Analytics />;
      default:
        return <SearchIcon />;
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2 // Add consistent spacing between sections
      }}
    >
      {/* Hero Section - Fixed Search Bar */}
      <Fade in timeout={1000}>
        <Card
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #115740 0%, #115740 45%, #FFC72C 87.5%, #EAAA00 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'sticky', // Make search bar sticky at top
            top: 0,
            zIndex: 10, // Ensure it stays above other content
            flexShrink: 0, // Prevent shrinking
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)',
            }}
          />
          <CardContent sx={{ p: 3, textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <Grow in timeout={1200}>
              <Box sx={{ mb: 3 }}>
                {user?.role === 'staff' && aiMode === 'chat' ? (
                  <ChatIcon sx={{ fontSize: 40, color: 'white', mb: 1.5 }} />
                ) : (
                  <MagicIcon sx={{ fontSize: 40, color: 'white', mb: 1.5 }} />
                )}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    mb: 1
                  }}
                >
                  {user?.role === 'staff' && aiMode === 'chat' ? 'Horizon AI Assistant' : 'Horizon AI Search'}
                </Typography>
                
                {user?.role === 'staff' && (
                  <Chip
                    label={aiMode === 'chat' ? 'Chat Mode - Press Enter to Send' : 'Search Mode - Real-time Results'}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      mb: 1.5,
                      fontSize: '0.75rem',
                      '& .MuiChip-label': {
                        fontWeight: 500
                      }
                    }}
                  />
                )}
                <Typography
                  variant="body1"
                  sx={{
                    color: 'white',
                    opacity: 0.9,
                    maxWidth: '500px',
                    mx: 'auto'
                  }}
                >
                  {isAuthenticated
                    ? `Welcome back, ${user?.name}! ${user?.role === 'staff' && aiMode === 'chat'
                        ? 'Chat with your AI teaching assistant for personalized support.'
                        : user?.role === 'staff'
                          ? 'Access AI-powered teaching tools and educational resources.'
                          : 'Discover your assignments, study materials, and academic resources.'}`
                    : 'Discover everything about Horizon Christian School with our intelligent search.'}
                </Typography>
              </Box>
            </Grow>

            <Slide direction="up" in timeout={1400}>
              <Grid container justifyContent="center">
                <Grid size={{ xs: 12, md: 8, lg: 6 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={getSearchPlaceholder()}
                    value={query}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        padding: '4px 8px',
                        '&:hover': {
                          background: 'rgba(255,255,255,1)',
                        },
                        '&.Mui-focused': {
                          background: 'rgba(255,255,255,1)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        },
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {user?.role === 'staff' && aiMode === 'chat' ? (
                            <ChatIcon sx={{ color: '#115740', fontSize: 24 }} />
                          ) : (
                            <SearchIcon sx={{ color: '#115740', fontSize: 24 }} />
                          )}
                        </InputAdornment>
                      ),
                      endAdornment: (isLoading || isChatLoading) && (
                        <InputAdornment position="end">
                          <CircularProgress size={24} sx={{ color: '#115740' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Compact Breadcrumbs for recent searches and chats */}
                  <CompactBreadcrumbs
                    onSearchClick={(searchQuery) => {
                      dispatch(setQuery(searchQuery));
                      performSearch(searchQuery);
                    }}
                    onChatClick={(sessionId, title) => {
                      // Handle chat click if needed
                      console.log('Open chat session:', sessionId, title);
                    }}
                    maxItems={5}
                    maxQueryLength={30}
                  />
                </Grid>
              </Grid>
            </Slide>

            {searchHistory.length > 0 && !query && (
              <Fade in timeout={1600}>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      opacity: 0.8,
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TrendingIcon sx={{ mr: 1, fontSize: 20 }} />
                    Recent searches:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      justifyContent: 'center'
                    }}
                  >
                    {searchHistory.slice(0, 5).map((historyItem, index) => (
                      <Grow key={index} in timeout={1800 + index * 100}>
                        <Chip
                          label={historyItem}
                          size="medium"
                          icon={<History />}
                          onClick={() => {
                            dispatch(setQuery(historyItem));
                            performSearch(historyItem);
                          }}
                          sx={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.3)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            },
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                          }}
                        />
                      </Grow>
                    ))}
                  </Box>
                </Box>
              </Fade>
            )}
          </CardContent>
        </Card>
      </Fade>

      {/* Breadcrumbs Section */}
      {isAuthenticated && (
        <BreadcrumbErrorBoundary fallbackMessage="Recent activity temporarily unavailable">
          <Breadcrumbs 
            showSearches={true}
            showChats={user?.settings?.chatEnabled}
            maxItems={6}
            compact={false}
          />
        </BreadcrumbErrorBoundary>
      )}

      {/* Results Section */}
      <Card
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.2)',
          flex: 1, // Take remaining space
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0, // Ensure proper flex behavior
        }}
      >
        <Box
          sx={{
            height: '100%',
            overflow: 'auto',
            pt: 1, // Add top padding to prevent content from hiding behind sticky search bar
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0,0,0,0.3)',
              },
            },
          }}
        >
          {error && (
            <Fade in>
              <Alert
                severity="error"
                className="m-4"
                sx={{ borderRadius: '12px' }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* AI Thinking Indicator for Chat Mode */}
          {isChatLoading && user?.role === 'staff' && aiMode === 'chat' && (
            <Fade in timeout={300}>
              <Box sx={{ p: 2.5 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    mb: 2
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ChatIcon sx={{ color: '#10b981', fontSize: 24 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#10b981',
                            fontSize: '1rem',
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        >
                          AI Assistant is thinking...
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
                          >
                            Processing your request
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[0, 1, 2].map((i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: '#10b981',
                                  animation: 'pulse 1.5s ease-in-out infinite',
                                  animationDelay: `${i * 0.3}s`,
                                  '@keyframes pulse': {
                                    '0%, 80%, 100%': {
                                      opacity: 0.3,
                                      transform: 'scale(0.8)'
                                    },
                                    '40%': {
                                      opacity: 1,
                                      transform: 'scale(1.2)'
                                    }
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <CircularProgress
                        size={20}
                        sx={{
                          color: '#10b981',
                          '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round'
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}

          {chatResponse && user?.role === 'staff' && aiMode === 'chat' && !isChatLoading && (
            <Fade in timeout={300}>
              <Box sx={{ p: 2.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  <ChatIcon sx={{ mr: 1, color: '#10b981', fontSize: 22 }} />
                  AI Assistant Response
                </Typography>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    mb: 2
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.primary',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {chatResponse}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          )}

          {/* Loading skeleton when typing or AI is working */}
          {(isLoading || isTyping) && aiMode === 'search' && query.trim().length >= 3 && (
            <LoadingSkeleton 
              count={3} 
              showAIIndicator={isLoading && !isTyping}
              isTyping={isTyping && !isLoading}
            />
          )}

          {/* AI Instant Answer */}
          {aiAnswer && aiMode === 'search' && (
            <Box sx={{ p: 2.5, pb: 0 }}>
              <AIInstantAnswerComponent answer={aiAnswer} query={query} />
            </Box>
          )}

          {/* AI Answer Loading */}
          {isGeneratingAnswer && aiMode === 'search' && (
            <Box sx={{ p: 2.5, pb: 0 }}>
              <LoadingSkeleton
                count={1}
                showAIIndicator={true}
                isTyping={false}
              />
            </Box>
          )}

          {results.length > 0 && aiMode === 'search' && (
            <Box sx={{ p: 2.5 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1.1rem'
                }}
              >
                <IdeaIcon sx={{ mr: 1, color: '#eab308', fontSize: 22 }} />
                Search Results ({results.length})
              </Typography>
              <List>
                {results.map((result, index) => (
                  <Fade key={result.id} in timeout={300 + index * 100}>
                    <Card
                      elevation={0}
                      sx={{
                        marginBottom: '12px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                          background: 'rgba(255,255,255,0.95)',
                        },
                      }}
                    >
                      <ListItemButton
                        onClick={() => window.open(result.url, '_blank')}
                        sx={{
                          padding: '16px',
                          borderRadius: '12px',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: '56px',
                            '& .MuiSvgIcon-root': {
                              fontSize: '1.75rem',
                              color: '#115740',
                            },
                          }}
                        >
                          {getCategoryIcon(result.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={result.title}
                          secondary={
                            <Box component="div">
                              <Box
                                component="div"
                                sx={{
                                  color: 'text.secondary',
                                  mb: 1.5,
                                  lineHeight: 1.5,
                                  fontSize: '1rem'
                                }}
                              >
                                {result.description}
                              </Box>
                              <Chip
                                label={result.category}
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, #115740 0%, #22a06b 100%)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  borderRadius: '8px',
                                }}
                              />
                            </Box>
                          }
                          primaryTypographyProps={{
                            variant: 'h6',
                            sx: {
                              fontWeight: 'bold',
                              color: 'text.primary',
                              mb: 0.5,
                              fontSize: '1.05rem'
                            }
                          }}
                          secondaryTypographyProps={{
                            component: 'div'
                          }}
                        />
                      </ListItemButton>
                    </Card>
                  </Fade>
                ))}
              </List>
            </Box>
          )}

          {!isLoading && !error && results.length === 0 && !chatResponse && query && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                {user?.role === 'staff' && aiMode === 'chat' ? (
                  <ChatIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
                ) : (
                  <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
                )}
                <Typography
                  variant="h6"
                  sx={{ color: 'text.secondary', mb: 1 }}
                >
                  {user?.role === 'staff' && aiMode === 'chat'
                    ? `No response generated for "${query}"`
                    : `No results found for "${query}"`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.disabled' }}
                >
                  {user?.role === 'staff' && aiMode === 'chat'
                    ? 'Try rephrasing your question or ask something else.'
                    : 'Try adjusting your search terms or browse the quick links.'}
                </Typography>
              </Box>
            </Fade>
          )}

          {!query && !isLoading && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                {user?.role === 'staff' && aiMode === 'chat' ? (
                  <ChatIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
                ) : (
                  <MagicIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
                )}
                <Typography
                  variant="h6"
                  sx={{ color: 'text.secondary', mb: 1 }}
                >
                  {user?.role === 'staff' && aiMode === 'chat'
                    ? 'Ready to chat?'
                    : 'Ready to explore?'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.disabled' }}
                >
                  {user?.role === 'staff' && aiMode === 'chat'
                    ? 'Ask your AI assistant about teaching, lesson planning, or student support.'
                    : 'Start typing to discover amazing resources and tools.'}
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default SearchSection;