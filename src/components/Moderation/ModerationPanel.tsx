import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Block,
  CheckCircle,
  Warning,
  Refresh,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import backendService, { ModerationRule } from '../../services/backendService';

interface ModerationPanelProps {
  userRole: 'guest' | 'student' | 'staff';
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ModerationRule>>({
    ruleType: 'keyword',
    action: 'block',
    value: '',
    reason: '',
    severity: 'medium',
    caseSensitive: false,
    isActive: true,
  });

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await backendService.getModerationRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load moderation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'staff') {
      loadRules();
    }
  }, [userRole]);

  // Staff-only access
  if (userRole !== 'staff') {
    return <Alert severity="error">Access Denied - Staff Only</Alert>;
  }

  const handleCreateRule = async () => {
    try {
      const newRule = await backendService.createModerationRule(formData as any);
      if (newRule) {
        await loadRules();
        setCreateDialogOpen(false);
        resetForm();
      } else {
        alert('Failed to create rule');
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule?._id) return;

    try {
      const success = await backendService.updateModerationRule(editingRule._id, formData);
      if (success) {
        await loadRules();
        setEditingRule(null);
        resetForm();
      } else {
        alert('Failed to update rule');
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
      alert('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      const success = await backendService.deleteModerationRule(ruleId);
      if (success) {
        await loadRules();
      } else {
        alert('Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const success = await backendService.toggleModerationRule(ruleId);
      if (success) {
        await loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ruleType: 'keyword',
      action: 'block',
      value: '',
      reason: '',
      severity: 'medium',
      caseSensitive: false,
      isActive: true,
    });
  };

  const openEditDialog = (rule: ModerationRule) => {
    setEditingRule(rule);
    setFormData({
      ruleType: rule.ruleType,
      action: rule.action,
      value: rule.value,
      pattern: rule.pattern,
      reason: rule.reason,
      severity: rule.severity,
      caseSensitive: rule.caseSensitive,
      isActive: rule.isActive,
    });
  };

  const filterRules = (ruleType?: string, action?: string) => {
    return rules.filter((rule) => {
      if (ruleType && rule.ruleType !== ruleType) return false;
      if (action && rule.action !== action) return false;
      return true;
    });
  };

  const blockedDomains = filterRules('domain', 'block');
  const allowedDomains = filterRules('domain', 'allow');
  const blockedKeywords = filterRules('keyword', 'block');

  const getRuleIcon = (action: string) => {
    switch (action) {
      case 'block':
        return <Block color="error" />;
      case 'allow':
        return <CheckCircle color="success" />;
      case 'flag':
        return <Warning color="warning" />;
      default:
        return undefined;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Content Moderation</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadRules}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Rules
              </Typography>
              <Typography variant="h4">{rules.length}</Typography>
              <Typography variant="caption">
                {rules.filter((r) => r.isActive).length} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Blocked Domains
              </Typography>
              <Typography variant="h4">{blockedDomains.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Blocked Keywords
              </Typography>
              <Typography variant="h4">{blockedKeywords.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Allowed Domains
              </Typography>
              <Typography variant="h4" color="success.main">
                {allowedDomains.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="All Rules" />
          <Tab label="Blocked Domains" />
          <Tab label="Allowed Domains" />
          <Tab label="Blocked Keywords" />
        </Tabs>
      </Box>

      {/* Rules Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Active</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Hits</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0
              ? rules
              : tabValue === 1
              ? blockedDomains
              : tabValue === 2
              ? allowedDomains
              : blockedKeywords
            ).map((rule) => (
              <TableRow key={rule._id}>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => rule._id && handleToggleRule(rule._id)}
                  >
                    {rule.isActive ? <PlayArrow color="success" /> : <Pause />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Chip label={rule.ruleType} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getRuleIcon(rule.action)}
                    label={rule.action}
                    size="small"
                    color={
                      rule.action === 'block'
                        ? 'error'
                        : rule.action === 'allow'
                        ? 'success'
                        : 'warning'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography noWrap sx={{ maxWidth: 200 }}>
                    {rule.value}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 150 }}>
                    {rule.reason || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={rule.severity || 'medium'}
                    size="small"
                    color={getSeverityColor(rule.severity)}
                  />
                </TableCell>
                <TableCell>{rule.hitCount || 0}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEditDialog(rule)}>
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => rule._id && handleDeleteRule(rule._id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editingRule !== null}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingRule(null);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
                label="Rule Type"
              >
                <MenuItem value="keyword">Keyword</MenuItem>
                <MenuItem value="domain">Domain</MenuItem>
                <MenuItem value="url">URL</MenuItem>
                <MenuItem value="pattern">Pattern (Regex)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                label="Action"
              >
                <MenuItem value="block">Block</MenuItem>
                <MenuItem value="allow">Allow</MenuItem>
                <MenuItem value="flag">Flag for Review</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={
                formData.ruleType === 'domain'
                  ? 'example.com'
                  : formData.ruleType === 'keyword'
                  ? 'inappropriate word'
                  : 'https://example.com/path'
              }
            />

            {formData.ruleType === 'pattern' && (
              <TextField
                fullWidth
                label="Regex Pattern"
                value={formData.pattern || ''}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                placeholder="\\b(bad|word)\\b"
              />
            )}

            <TextField
              fullWidth
              label="Reason"
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={2}
              placeholder="Why is this rule needed?"
            />

            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                label="Severity"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.caseSensitive || false}
                  onChange={(e) =>
                    setFormData({ ...formData, caseSensitive: e.target.checked })
                  }
                />
              }
              label="Case Sensitive"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditingRule(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editingRule ? handleUpdateRule : handleCreateRule}
            disabled={!formData.value}
          >
            {editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModerationPanel;
