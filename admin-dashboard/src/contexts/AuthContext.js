import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

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
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiService.setToken(token);
        const { user: profile } = await apiService.getProfile();
        
        if (profile.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          await logout();
          return;
        }
        
        setUser(profile);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      const { user: profile, token } = await apiService.login(normalizedEmail, password);
      
      if (profile.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return { success: false };
      }
      
      apiService.setToken(token);
      localStorage.setItem('auth_token', token);
      setUser(profile);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      apiService.setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
