import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Microsoft as MicrosoftIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setUser, setLoading, setRememberMe } from '../../store/slices/authSlice';
import { AuthService } from '../../services/authService';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const { isLoading, rememberMe } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    dispatch(setLoading(true));
    setError(null);

    try {
      const user = await AuthService.login(rememberMe);
      if (user) {
        dispatch(setUser(user));
        onClose();
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }

    dispatch(setLoading(false));
  };

  const handleRememberMeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setRememberMe(event.target.checked));
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'rounded-lg',
      }}
    >
      <DialogTitle>
        <Box className="flex items-center space-x-2">
          <SchoolIcon className="text-blue-600" />
          <Typography variant="h6" className="font-bold">
            Sign in to Horizon Christian School
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent className="pb-2">
        <Typography variant="body1" className="text-gray-600 mb-4">
          Access your personalized dashboard with assignments, resources, and tools.
        </Typography>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Box className="space-y-4">
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MicrosoftIcon />}
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </Button>

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={handleRememberMeChange}
                disabled={isLoading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" className="text-gray-600">
                Remember me for 30 days
              </Typography>
            }
          />

          <Box className="bg-gray-50 rounded-lg p-4">
            <Typography variant="body2" className="text-gray-700 mb-2 font-medium">
              What you'll get:
            </Typography>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Personalized search results</li>
              <li>• Access to assignments and grades</li>
              <li>• Role-specific quick links</li>
              <li>• AI-powered learning assistance</li>
            </ul>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="px-6 pb-6">
        <Button
          onClick={handleClose}
          disabled={isLoading}
          className="text-gray-600"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;