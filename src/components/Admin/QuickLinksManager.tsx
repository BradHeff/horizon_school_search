import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import backendService from '../../services/backendService';
import QuickLinkDialog from './QuickLinkDialog';

interface QuickLink {
  linkId: string;
  title: string;
  url: string;
  description?: string;
  icon: string;
  category: string;
  roles: string[];
  order: number;
  isActive: boolean;
  clickCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const QuickLinksManager: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const categories = ['Academic', 'Resources', 'Tools', 'Administration', 'Communication', 'Other'];
  const roles = ['guest', 'student', 'staff'];

  useEffect(() => {
    loadLinks();
  }, [categoryFilter, activeFilter, roleFilter]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      if (categoryFilter) filters.category = categoryFilter;
      if (activeFilter !== '') filters.isActive = activeFilter === 'true';
      if (roleFilter) filters.role = roleFilter;

      const data = await backendService.getQuickLinksForAdmin(filters);
      setLinks(data);
    } catch (err: any) {
      console.error('Failed to load links:', err);
      setError(err.message || 'Failed to load quick links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLink(null);
    setDialogOpen(true);
  };

  const handleEdit = (link: QuickLink) => {
    setEditingLink(link);
    setDialogOpen(true);
  };

  const handleDelete = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      setError(null);
      await backendService.deleteQuickLink(linkId);
      setSuccess('Link deleted successfully');
      loadLinks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete link:', err);
      setError(err.message || 'Failed to delete link');
    }
  };

  const handleToggle = async (link: QuickLink) => {
    try {
      setError(null);
      await backendService.toggleQuickLink(link.linkId);
      setSuccess(`Link ${link.isActive ? 'deactivated' : 'activated'} successfully`);
      loadLinks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to toggle link:', err);
      setError(err.message || 'Failed to toggle link');
    }
  };

  const handleSave = async (linkData: Partial<QuickLink>) => {
    try {
      setError(null);
      if (editingLink) {
        // Update existing link
        await backendService.updateQuickLink(editingLink.linkId, linkData);
        setSuccess('Link updated successfully');
      } else {
        // Create new link
        await backendService.createQuickLink(linkData as any);
        setSuccess('Link created successfully');
      }
      setDialogOpen(false);
      setEditingLink(null);
      loadLinks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save link:', err);
      setError(err.message || 'Failed to save link');
      throw err; // Re-throw to keep dialog open
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'guest':
        return 'default';
      case 'student':
        return 'primary';
      case 'staff':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      Academic: '#2196F3',
      Resources: '#4CAF50',
      Tools: '#FF9800',
      Administration: '#9C27B0',
      Communication: '#00BCD4',
      Other: '#757575',
    };
    return colors[category] || colors.Other;
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Quick Links Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLinks}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={loading}
          >
            Add Link
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={activeFilter}
            label="Status"
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(categoryFilter || activeFilter || roleFilter) && (
          <Button
            variant="text"
            onClick={() => {
              setCategoryFilter('');
              setActiveFilter('');
              setRoleFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </Stack>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : links.length === 0 ? (
        <Alert severity="info">
          No quick links found. {categoryFilter || activeFilter || roleFilter ? 'Try adjusting your filters.' : 'Create your first link to get started.'}
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="center">Order</TableCell>
                <TableCell align="center">Clicks</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.linkId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {link.title}
                    </Typography>
                    {link.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {link.description.length > 50
                          ? link.description.substring(0, 50) + '...'
                          : link.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'primary.dark',
                        },
                      }}
                    >
                      {link.url}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={link.category}
                      size="small"
                      sx={{
                        backgroundColor: getCategoryColor(link.category),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {link.roles.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          color={getRoleBadgeColor(role) as any}
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">{link.order}</TableCell>
                  <TableCell align="center">{link.clickCount || 0}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={link.isActive ? 'Active' : 'Inactive'}
                      color={link.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={link.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggle(link)}
                        color={link.isActive ? 'success' : 'default'}
                      >
                        {link.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(link)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(link.linkId)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <QuickLinkDialog
        open={dialogOpen}
        link={editingLink}
        onClose={() => {
          setDialogOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSave}
      />
    </Paper>
  );
};

export default QuickLinksManager;
