import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// API service for backend calls
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password, role = 'student') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Books endpoints
  async getBooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/books?${queryString}`);
  }

  async getBook(id) {
    return this.request(`/books/${id}`);
  }

  async uploadBook(formData) {
    const url = `${this.baseURL}/books`;
    const config = {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        // Don't set Content-Type for FormData - let the browser set it with boundary
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload request failed:', error);
      throw error;
    }
  }

  async updateBook(id, bookData) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  async deleteBook(id) {
    return this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async getBooksByRack(letter, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/books/rack/${letter}?${queryString}`);
  }

  // Downloads endpoints
  async recordDownload(bookId) {
    return this.request('/downloads', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId }),
    });
  }

  async getDownloadHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/downloads/history?${queryString}`);
  }

  // Categories endpoints
  async getCategories() {
    return this.request('/categories');
  }

  // Users endpoints (admin only)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  async getUserStats() {
    return this.request('/users/stats/overview');
  }
}

export const apiService = new ApiService();
