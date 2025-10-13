import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

type ThemeMode = 'light' | 'dark' | 'system';

interface DarkModeToggleProps {
  onThemeChange?: (mode: ThemeMode) => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ onThemeChange }) => {
  const theme = useTheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Get saved preference or default to system
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'system';
  });

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Apply initial theme
    if (themeMode === 'system') {
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      applyTheme(themeMode);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);

  const applyTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.body.style.backgroundColor = '#121212';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
  };

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    setThemeMode(nextMode);
    localStorage.setItem('themeMode', nextMode);

    if (onThemeChange) {
      onThemeChange(nextMode);
    }

    // Apply theme immediately if not system mode
    if (nextMode !== 'system') {
      applyTheme(nextMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Brightness7Icon />;
      case 'dark':
        return <Brightness4Icon />;
      case 'system':
        return <SettingsBrightnessIcon />;
    }
  };

  const getTooltip = () => {
    switch (themeMode) {
      case 'light':
        return 'Light mode (click for dark)';
      case 'dark':
        return 'Dark mode (click for system)';
      case 'system':
        return 'System theme (click for light)';
    }
  };

  return (
    <Tooltip title={getTooltip()}>
      <IconButton onClick={cycleTheme} color="inherit" aria-label="toggle theme">
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
