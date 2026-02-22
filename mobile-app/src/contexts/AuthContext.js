import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { apiService } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Get user profile from our database
          try {
            const token = session.access_token;
            apiService.setToken(token);
            await AsyncStorage.setItem('auth_token', token);
            
            const { user: profile } = await apiService.getProfile();
            setUser(profile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            await logout();
          }
        } else {
          setUser(null);
          apiService.setToken(null);
          await AsyncStorage.removeItem('auth_token');
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        apiService.setToken(token);
        const { user: profile } = await apiService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { user: profile, token } = await apiService.login(email, password);
      
      apiService.setToken(token);
      await AsyncStorage.setItem('auth_token', token);
      setUser(profile);
      
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: `Welcome back, ${profile.email}!`,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Invalid email or password',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, role = 'student') => {
    try {
      setLoading(true);
      const { user: profile, token } = await apiService.register(email, password, role);
      
      if (profile && token) {
        apiService.setToken(token);
        await AsyncStorage.setItem('auth_token', token);
        setUser(profile);
        
        Toast.show({
          type: 'success',
          text1: 'Registration Successful',
          text2: 'Welcome to Library Management!',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Registration Initiated',
          text2: 'Please check your email to verify your account.',
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Failed to create account',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('auth_token');
      apiService.setToken(null);
      setUser(null);
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      // This would be implemented if we had profile updates
      Toast.show({
        type: 'info',
        text1: 'Feature Coming Soon',
        text2: 'Profile updates will be available soon.',
      });
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
