import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
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
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const token = session.access_token;
            apiService.setToken(token);
            localStorage.setItem('auth_token', token);
            
            const { user: profile } = await apiService.getProfile();
            
            // Only allow admin users
            if (profile.role !== 'admin') {
              toast.error('Access denied. Admin privileges required.');
              await logout();
              return;
            }
            
            setUser(profile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            await logout();
          }
        } else {
          setUser(null);
          apiService.setToken(null);
          localStorage.removeItem('auth_token');
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
      const { user: profile, token } = await apiService.login(email, password);
      
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
      toast.error(error.message || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
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
