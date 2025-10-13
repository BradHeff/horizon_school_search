import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip, Box, Typography, Paper, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import StopIcon from '@mui/icons-material/Stop';

interface VoiceSearchProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onTranscript, onError, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalText += transcriptPart + ' ';
          } else {
            interimText += transcriptPart;
          }
        }

        setInterimTranscript(interimText);

        if (finalText) {
          const newTranscript = (transcript + finalText).trim();
          setTranscript(newTranscript);
          onTranscript(newTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        const errorMessage = getErrorMessage(event.error);
        setIsListening(false);
        if (onError) {
          onError(errorMessage);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const getErrorMessage = (error: string): string => {
    const errorMessages: { [key: string]: string } = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Please check your microphone.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'aborted': 'Speech recognition was aborted.',
    };

    return errorMessages[error] || 'An error occurred with voice recognition.';
  };

  const startListening = useCallback(() => {
    if (!recognition || disabled) return;

    try {
      setTranscript('');
      setInterimTranscript('');
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
      if (onError) {
        onError('Failed to start voice recognition');
      }
    }
  }, [recognition, disabled, onError]);

  const stopListening = useCallback(() => {
    if (!recognition) return;

    try {
      recognition.stop();
      setIsListening(false);

      // Send final transcript
      if (transcript) {
        onTranscript(transcript);
      }
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }, [recognition, transcript, onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Tooltip title="Voice search not supported in this browser">
        <span>
          <IconButton disabled>
            <MicOffIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Box position="relative">
      <Tooltip title={isListening ? 'Stop voice search' : 'Start voice search'}>
        <IconButton
          onClick={toggleListening}
          disabled={disabled}
          color={isListening ? 'error' : 'default'}
          sx={{
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          {isListening ? <StopIcon /> : <MicIcon />}
        </IconButton>
      </Tooltip>

      {isListening && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            p: 2,
            minWidth: 300,
            maxWidth: 400,
            zIndex: 1000,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Listening...
            </Typography>
          </Box>

          {(transcript || interimTranscript) && (
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {transcript}
                <span style={{ opacity: 0.6 }}>{interimTranscript}</span>
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Click the microphone again to stop
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default VoiceSearch;
