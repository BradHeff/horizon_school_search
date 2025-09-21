// Error Boundary for Breadcrumbs Component
// Prevents crashes and infinite loops from propagating up

import { Refresh as RefreshIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorCount: number;
  lastError: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  maxErrors?: number;
}

class BreadcrumbErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      lastError: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      lastError: error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Breadcrumb Error Boundary caught error:', error, errorInfo);
    
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));

    // Auto-reset after 30 seconds if not too many errors
    if (this.state.errorCount < (this.props.maxErrors || 5)) {
      this.resetTimeoutId = setTimeout(() => {
        this.handleReset();
      }, 30000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      lastError: null
    });
  };

  render() {
    if (this.state.hasError) {
      const tooManyErrors = this.state.errorCount >= (this.props.maxErrors || 5);
      
      return (
        <Box sx={{
          p: 2,
          border: '1px solid #ff9800',
          borderRadius: 1,
          backgroundColor: '#fff3e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2
        }}>
          <WarningIcon color="warning" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="warning.main" fontWeight={600}>
              {tooManyErrors 
                ? 'Breadcrumbs disabled due to repeated errors'
                : (this.props.fallbackMessage || 'Unable to load recent activity')
              }
            </Typography>
            {this.state.lastError && !tooManyErrors && (
              <Typography variant="caption" color="text.secondary">
                {this.state.lastError.message}
              </Typography>
            )}
          </Box>
          {!tooManyErrors && (
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{ ml: 1 }}
            >
              Retry
            </Button>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default BreadcrumbErrorBoundary;