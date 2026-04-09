import React, { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Tweeter } from '../quiz/Tweeter';

export default function TweeterThemeWrapper() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    setIsDarkMode(isDark);

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

  const theme = useMemo(
    () =>
      createTheme({
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
      }),
    [isDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Tweeter />
      </div>
    </ThemeProvider>
  );
}
