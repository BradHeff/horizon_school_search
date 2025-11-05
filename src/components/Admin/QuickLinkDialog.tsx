import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Box,
  OutlinedInput,
  SelectChangeEvent,
  Alert,
  Stack,
} from '@mui/material';

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
}

interface QuickLinkDialogProps {
  open: boolean;
  link: QuickLink | null;
  onClose: () => void;
  onSave: (link: Partial<QuickLink>) => Promise<void>;
}

const QuickLinkDialog: React.FC<QuickLinkDialogProps> = ({ open, link, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    icon: 'Link',
    category: 'Other',
    roles: ['student', 'staff'] as string[],
    order: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const categories = ['Academic', 'Resources', 'Tools', 'Administration', 'Communication', 'Other'];
  const roleOptions = ['guest', 'student', 'staff'];
  const iconOptions = [
    'Link',
    'School',
    'LibraryBooks',
    'Work',
    'LocalLibrary',
    'SupervisorAccount',
    'Assignment',
    'Person',
    'Event',
  ];

  useEffect(() => {
    if (link) {
      // Editing existing link
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description || '',
        icon: link.icon,
        category: link.category,
        roles: link.roles,
        order: link.order,
        isActive: link.isActive,
      });
    } else {
      // Creating new link
      setFormData({
        title: '',
        url: '',
        description: '',
        icon: 'Link',
        category: 'Other',
        roles: ['student', 'staff'],
        order: 0,
        isActive: true,
      });
    }
    setErrors({});
    setSaveError(null);
  }, [link, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || 'Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      roles: typeof value === 'string' ? value.split(',') : value,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{link ? 'Edit Quick Link' : 'Create Quick Link'}</DialogTitle>
      <DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={!!errors.title}
            helperText={errors.title}
            required
          />

          {/* URL */}
          <TextField
            fullWidth
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            error={!!errors.url}
            helperText={errors.url}
            placeholder="https://example.com"
            required
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
            placeholder="Brief description of this link"
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Category */}
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Icon */}
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={formData.icon}
                  label="Icon"
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {iconOptions.map((icon) => (
                    <MenuItem key={icon} value={icon}>
                      {icon}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Roles */}
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth error={!!errors.roles}>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={formData.roles}
                  onChange={handleRoleChange}
                  input={<OutlinedInput label="Roles" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {roleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.roles && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                    {errors.roles}
                  </Box>
                )}
              </FormControl>
            </Box>

            {/* Order */}
            <Box sx={{ flex: '1 1 200px' }}>
              <TextField
                fullWidth
                type="number"
                label="Order"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />
            </Box>
          </Box>

          {/* Active Status */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : link ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickLinkDialog;
