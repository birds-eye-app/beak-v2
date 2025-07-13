import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Chirped } from '../chirped/Chirped';

export default function ChirpedThemeWrapper() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    setIsDarkMode(isDark);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          const isDark =
            document.documentElement.getAttribute('data-theme') === 'dark';
          setIsDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#25c2a0' : '#2e8555',
      },
      background: {
        default: isDarkMode ? '#1b1b1d' : '#eee',
        paper: isDarkMode ? '#2d2d30' : '#fff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Chirped />
      </div>
    </ThemeProvider>
  );
}
