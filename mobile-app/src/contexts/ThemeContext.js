import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const customLightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#6366f1',
      secondary: '#8b5cf6',
      tertiary: '#ec4899',
      background: '#ffffff',
      surface: '#f8fafc',
      onSurface: '#1e293b',
      onBackground: '#1e293b',
    },
  };

  const customDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#818cf8',
      secondary: '#a78bfa',
      tertiary: '#f472b6',
      background: '#0f172a',
      surface: '#1e293b',
      onSurface: '#f1f5f9',
      onBackground: '#f1f5f9',
    },
  };

  const theme = isDarkMode ? customDarkTheme : customLightTheme;

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    colors: theme.colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
