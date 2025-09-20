import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Support as SupportIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

interface SupportDialogProps {
  open: boolean;
  onClose: () => void;
}

const SupportDialog: React.FC<SupportDialogProps> = ({ open, onClose }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [requestType, setRequestType] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setRequestType('');
      setDescription('');
      onClose();
    }, 2000);
  };

  const isFormValid = requestType && description.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'rounded-lg',
      }}
    >
      <DialogTitle>
        <Box className="flex items-center space-x-2">
          <SupportIcon className="text-green-600" />
          <Typography variant="h6" className="font-bold">
            Request Support
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {showSuccess ? (
          <Alert severity="success" className="mb-4">
            Your support request has been submitted successfully! Our team will get back to you soon.
          </Alert>
        ) : (
          <>
            <Typography variant="body1" className="text-gray-600 mb-4">
              Need help? Our IT support team is here to assist you with technical issues and questions.
            </Typography>

            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Box className="text-center p-4 bg-blue-50 rounded-lg">
                <EmailIcon className="text-blue-600 mb-2" fontSize="large" />
                <Typography variant="subtitle2" className="font-medium">
                  Email Support
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  support@horizon.edu
                </Typography>
              </Box>

              <Box className="text-center p-4 bg-green-50 rounded-lg">
                <PhoneIcon className="text-green-600 mb-2" fontSize="large" />
                <Typography variant="subtitle2" className="font-medium">
                  Phone Support
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  (555) 123-4567
                </Typography>
              </Box>

              <Box className="text-center p-4 bg-purple-50 rounded-lg">
                <ChatIcon className="text-purple-600 mb-2" fontSize="large" />
                <Typography variant="subtitle2" className="font-medium">
                  Live Chat
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Mon-Fri 8AM-5PM
                </Typography>
              </Box>
            </Box>

            <Box className="space-y-4">
              {isAuthenticated && user && (
                <Box className="bg-gray-50 rounded-lg p-3">
                  <Typography variant="body2" className="text-gray-700">
                    <strong>User:</strong> {user.name} ({user.email})
                  </Typography>
                  <Typography variant="body2" className="text-gray-700">
                    <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Typography>
                </Box>
              )}

              <FormControl fullWidth>
                <InputLabel>Request Type</InputLabel>
                <Select
                  value={requestType}
                  label="Request Type"
                  onChange={(e) => setRequestType(e.target.value)}
                >
                  <MenuItem value="technical">Technical Issue</MenuItem>
                  <MenuItem value="account">Account Access</MenuItem>
                  <MenuItem value="password">Password Reset</MenuItem>
                  <MenuItem value="application">Application Support</MenuItem>
                  <MenuItem value="training">Training Request</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Please describe your issue or question in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helperText="Include any error messages, steps you've tried, or specific details"
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions className="px-6 pb-6">
        <Button onClick={onClose} disabled={isSubmitting}>
          {showSuccess ? 'Close' : 'Cancel'}
        </Button>
        {!showSuccess && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SupportDialog;