import React from 'react';
import { Container, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import BarcodeScanner from './components/BarcodeScanner';
import PostitNote from './components/PostitNote';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
});

function App() {
  // This will cause the Component to rerender if the system preference changes
  const [prefersDarkMode, setPrefersDarkMode] = React.useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Effect for adding the listener
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setPrefersDarkMode(mediaQuery.matches);
    
    // Add the callback as a listener
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Older browsers support
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Manually toggle dark mode
  const toggleDarkMode = () => {
    setPrefersDarkMode(!prefersDarkMode);
    // Apply dark mode class to body
    if (!prefersDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Apply dark mode class to body element when preference changes
  React.useEffect(() => {
    if (prefersDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [prefersDarkMode]);

  // Generate theme based on dark mode preference
  const appTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: prefersDarkMode ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: prefersDarkMode ? '#121212' : '#ffffff',
            paper: prefersDarkMode ? '#1E1E1E' : '#ffffff',
          },
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <PostitNote />
      <Box sx={{ 
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Container maxWidth="md" sx={{ 
          flex: 1, 
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <BarcodeScanner isDarkMode={prefersDarkMode} toggleDarkMode={toggleDarkMode} />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 