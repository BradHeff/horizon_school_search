import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Block,
  Visibility,
  ThumbUp,
  ThumbDown,
  Flag,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import backendService, {
  SearchHistoryItem,
  ModerationStats,
} from '../../services/backendService';

interface AnalyticsDashboardProps {
  userRole: 'guest' | 'student' | 'staff';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [tabValue, setTabValue] = useState(0); // 0 = All, 1 = Flagged, 2 = Blocked, 3 = Approved
  const [selectedSearch, setSelectedSearch] = useState<SearchHistoryItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [authRetries, setAuthRetries] = useState(0);
  const maxAuthRetries = 5;

  const loadData = useCallback(async () => {
    // Wait for backend authentication before making API calls
    if (!backendService.isAuthenticated()) {
      if (authRetries < maxAuthRetries) {
        console.log(`⏳ Analytics waiting for backend authentication... (attempt ${authRetries + 1}/${maxAuthRetries})`);
        setAuthRetries(prev => prev + 1);
        // Retry after a short delay
        setTimeout(() => {
          loadData();
        }, 500);
        return;
      } else {
        console.error('❌ Analytics: Backend authentication timeout after', maxAuthRetries, 'attempts');
        setLoading(false);
        return;
      }
    }

    // Reset retry counter on successful auth
    setAuthRetries(0);

    setLoading(true);
    try {
      // Determine what to load based on tab
      let searchesPromise;
      if (tabValue === 0) {
        // All unmoderated searches
        searchesPromise = backendService.getSearchesByTrigger(
          filterTrigger === 'all' ? undefined : filterTrigger,
          { limit: 100, includeModerated: false }
        );
      } else {
        // Moderated searches by action type
        const actionMap = { 1: 'flagged', 2: 'blocked', 3: 'approved' };
        searchesPromise = backendService.getModeratedSearches(
          actionMap[tabValue as keyof typeof actionMap] as 'flagged' | 'blocked' | 'approved',
          { limit: 100 }
        );
      }

      const [searchesData, statsData] = await Promise.all([
        searchesPromise,
        backendService.getModerationStats(),
      ]);

      setSearches(searchesData.searches);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterTrigger, tabValue, authRetries]);

  useEffect(() => {
    if (userRole === 'staff') {
      loadData();
    }
  }, [filterTrigger, tabValue, userRole, loadData]);

  // Staff-only access
  if (userRole !== 'staff') {
    return (
      <Alert severity="error">
        Access Denied - Staff Only
      </Alert>
    );
  }

  const handleViewSearch = (search: SearchHistoryItem) => {
    setSelectedSearch(search);
    setViewDialogOpen(true);
  };

  const handleModerate = async (action: 'approved' | 'blocked' | 'flagged', reason?: string) => {
    if (!selectedSearch) return;

    setModerating(true);
    try {
      const success = await backendService.moderateSearch(
        selectedSearch.searchId,
        action,
        reason
      );

      if (success) {
        // Reload data
        await loadData();
        setViewDialogOpen(false);
        setSelectedSearch(null);
      } else {
        alert('Failed to moderate search');
      }
    } catch (error) {
      console.error('Moderation failed:', error);
      alert('Failed to moderate search');
    } finally {
      setModerating(false);
    }
  };

  const getTriggerColor = (trigger?: string | null) => {
    switch (trigger) {
      case 'bad':
        return 'error';
      case 'questionable':
        return 'warning';
      case 'safe':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTriggerIcon = (trigger?: string | null) => {
    switch (trigger) {
      case 'bad':
        return <Block />;
      case 'questionable':
        return <Warning />;
      case 'safe':
        return <CheckCircle />;
      default:
        return undefined;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Search Analytics & Moderation
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Needs Attention
                </Typography>
                <Typography variant="h4" color="error">
                  {stats.moderation.needsAttention}
                </Typography>
                <Typography variant="caption">
                  Unmoderated "bad" searches
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bad Triggers
                </Typography>
                <Typography variant="h4">
                  {stats.triggers.bad || 0}
                </Typography>
                <Typography variant="caption">
                  Flagged as inappropriate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Questionable
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.triggers.questionable || 0}
                </Typography>
                <Typography variant="caption">
                  Needs review
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Safe Searches
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.triggers.safe || 0}
                </Typography>
                <Typography variant="caption">
                  Approved content
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Needs Review" icon={<Warning />} iconPosition="start" />
          <Tab label="Flagged" icon={<Flag />} iconPosition="start" />
          <Tab label="Blocked" icon={<Block />} iconPosition="start" />
          <Tab label="Approved" icon={<CheckCircle />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Filters */}
      {tabValue === 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterList />
          <TextField
            select
            label="Filter by Trigger"
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Triggers</MenuItem>
            <MenuItem value="bad">Bad</MenuItem>
            <MenuItem value="questionable">Questionable</MenuItem>
            <MenuItem value="safe">Safe</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      )}

      {tabValue !== 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      )}

      {/* Searches Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Trigger</TableCell>
              <TableCell>Query</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Results</TableCell>
              <TableCell>AI Answer</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {searches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No searches found
                </TableCell>
              </TableRow>
            ) : (
              searches.map((search) => (
                <TableRow key={search.searchId}>
                  <TableCell>
                    <Chip
                      icon={getTriggerIcon(search.trigger)}
                      label={search.trigger || 'None'}
                      color={getTriggerColor(search.trigger)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={search.query}>
                      <Typography noWrap sx={{ maxWidth: 200 }}>
                        {search.query}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip label={search.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {new Date(search.searchedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {search.contentRating !== null && search.contentRating !== undefined ? (
                      <Tooltip title={`Content Rating: ${search.contentRating}/100`}>
                        <Box
                          sx={{
                            width: 60,
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${search.contentRating}%`,
                              height: '100%',
                              bgcolor:
                                search.contentRating < 40
                                  ? 'error.main'
                                  : search.contentRating < 70
                                  ? 'warning.main'
                                  : 'success.main',
                            }}
                          />
                        </Box>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{search.resultCount}</TableCell>
                  <TableCell>
                    {search.hasAiAnswer ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewSearch(search)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View/Moderate Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSearch && (
          <>
            <DialogTitle>
              Search Details
              <Chip
                icon={getTriggerIcon(selectedSearch.trigger)}
                label={selectedSearch.trigger || 'No Trigger'}
                color={getTriggerColor(selectedSearch.trigger)}
                size="small"
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Query
                </Typography>
                <Typography variant="body1">{selectedSearch.query}</Typography>
              </Box>

              {selectedSearch.contentRating !== null && selectedSearch.contentRating !== undefined && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Content Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        flex: 1,
                        height: 20,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${selectedSearch.contentRating}%`,
                          height: '100%',
                          bgcolor:
                            selectedSearch.contentRating < 40
                              ? 'error.main'
                              : selectedSearch.contentRating < 70
                              ? 'warning.main'
                              : 'success.main',
                        }}
                      />
                    </Box>
                    <Typography>{selectedSearch.contentRating}/100</Typography>
                  </Box>
                </Box>
              )}

              {selectedSearch.triggerReason && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Trigger Reason
                  </Typography>
                  <Alert severity="warning">{selectedSearch.triggerReason}</Alert>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Details
                </Typography>
                <Typography variant="body2">
                  Date: {new Date(selectedSearch.searchedAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Category: {selectedSearch.category}
                </Typography>
                <Typography variant="body2">
                  Results: {selectedSearch.resultCount}
                </Typography>
                <Typography variant="body2">
                  AI Answer: {selectedSearch.hasAiAnswer ? 'Yes' : 'No'}
                </Typography>
              </Box>

              {!selectedSearch.isModerated && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This search has not been moderated yet. Take action below.
                </Alert>
              )}

              {selectedSearch.isModerated && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  This search was {selectedSearch.moderationAction} by a moderator.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              {!selectedSearch.isModerated && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ThumbUp />}
                    onClick={() => handleModerate('approved')}
                    disabled={moderating}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<Flag />}
                    onClick={() => handleModerate('flagged', 'Flagged for review')}
                    disabled={moderating}
                  >
                    Flag
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<ThumbDown />}
                    onClick={() => handleModerate('blocked', 'Blocked inappropriate content')}
                    disabled={moderating}
                  >
                    Block
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AnalyticsDashboard;
