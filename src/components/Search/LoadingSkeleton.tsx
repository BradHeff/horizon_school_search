import { AutoAwesome as AIIcon } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Fade,
    Skeleton,
    Typography,
} from '@mui/material';
import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  showAIIndicator?: boolean;
  isTyping?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 3, 
  showAIIndicator = true,
  isTyping = false 
}) => {
  return (
    <Box sx={{ p: 2.5 }}>
      {(showAIIndicator || isTyping) && (
        <Fade in timeout={500}>
          <Box
            sx={{
              mb: 1.5,
              textAlign: 'center',
              background: isTyping
                ? 'rgba(100, 116, 139, 0.1)'
                : 'rgba(102, 126, 234, 0.1)',
              borderRadius: '8px',
              p: 1,
              border: isTyping
                ? '1px solid rgba(100, 116, 139, 0.2)'
                : '1px solid rgba(102, 126, 234, 0.2)',
              color: isTyping ? 'text.secondary' : 'primary.main'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AIIcon
                sx={{
                  fontSize: 18,
                  animation: isTyping ? 'bounce 1s infinite' : 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.6 },
                    '50%': { opacity: 1 },
                    '100%': { opacity: 0.6 },
                  },
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-2px)' },
                    '60%': { transform: 'translateY(-1px)' },
                  }
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {isTyping
                  ? 'Continue typing to search...'
                  : 'AI is analyzing your search...'}
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}

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
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
        <Skeleton variant="text" width={200} />
      </Typography>

      {Array.from({ length: count }).map((_, index) => (
        <Fade key={index} in timeout={300 + index * 100}>
          <Card
            elevation={0}
            sx={{
              marginBottom: '12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* Icon skeleton */}
                <Skeleton 
                  variant="circular" 
                  width={28} 
                  height={28} 
                  sx={{ mt: 0.5 }}
                />
                
                {/* Content skeleton */}
                <Box sx={{ flexGrow: 1 }}>
                  {/* Title skeleton */}
                  <Skeleton 
                    variant="text" 
                    width={`${Math.random() * 40 + 60}%`} 
                    height={28} 
                    sx={{ mb: 1 }}
                  />
                  
                  {/* Description skeleton - multiple lines */}
                  <Skeleton 
                    variant="text" 
                    width="95%" 
                    height={20} 
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton 
                    variant="text" 
                    width={`${Math.random() * 30 + 50}%`} 
                    height={20} 
                    sx={{ mb: 1.5 }}
                  />
                  
                  {/* Category chip skeleton */}
                  <Skeleton 
                    variant="rounded" 
                    width={100} 
                    height={24} 
                    sx={{ borderRadius: '8px' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      ))}
    </Box>
  );
};

export default LoadingSkeleton;