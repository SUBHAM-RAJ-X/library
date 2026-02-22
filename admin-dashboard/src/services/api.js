import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log("API URL:", process.env.REACT_APP_API_URL || 'http://localhost:3001/api'); 

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Ensure class methods keep `this` when passed as callbacks (react-query queryFn/mutationFn).
    [
      'login',
      'getProfile',
      'getBooks',
      'getBook',
      'deleteBook',
      'updateBook',
      'getUsers',
      'getUser',
      'updateUser',
      'deleteUser',
      'getUserStats',
      'getCategories',
      'createCategory',
      'updateCategory',
      'deleteCategory',
      'getCategoryStats',
      'getPendingBooks',
      'getApprovalStats',
      'approveBook',
      'rejectBook',
      'getAllReviews',
      'getReviewsStats',
      'deleteReview',
      'getReadingAnalytics',
      'getTopReaders',
      'getPopularBooks',
      'getMostDownloadedBooks',
      'getDownloadStats',
    ].forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  setToken(token) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common.Authorization;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Books endpoints
  async getBooks(params = {}) {
    const response = await this.client.get('/books', { params });
    return response.data;
  }

  async getBook(id) {
    const response = await this.client.get(`/books/${id}`);
    return response.data;
  }

  async deleteBook(id) {
    const response = await this.client.delete(`/books/${id}`);
    return response.data;
  }

  async updateBook(id, bookData) {
    const response = await this.client.put(`/books/${id}`, bookData);
    return response.data;
  }

  // Users endpoints
  async getUsers(params = {}) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUser(id) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get('/users/stats/overview');
    return response.data;
  }

  // Categories endpoints
  async getCategories() {
    const response = await this.client.get('/categories');
    return response.data;
  }

  async createCategory(categoryData) {
    const response = await this.client.post('/categories', categoryData);
    return response.data;
  }

  async updateCategory(id, categoryData) {
    const response = await this.client.put(`/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id) {
    const response = await this.client.delete(`/categories/${id}`);
    return response.data;
  }

  async getCategoryStats() {
    const response = await this.client.get('/categories/stats/overview');
    return response.data;
  }

  // Approval endpoints
  async getPendingBooks(params = {}) {
    const response = await this.client.get('/approvals/pending', { params });
    return response.data;
  }

  async getApprovalStats() {
    const response = await this.client.get('/approvals/stats');
    return response.data;
  }

  async approveBook(bookId) {
    const response = await this.client.post(`/approvals/approve/${bookId}`);
    return response.data;
  }

  async rejectBook({ bookId, rejectionReason }) {
    const response = await this.client.post(`/approvals/reject/${bookId}`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  }

  // Reviews endpoints
  async getAllReviews(params = {}) {
    const response = await this.client.get('/reviews/admin/all', { params });
    return response.data;
  }

  async getReviewsStats() {
    const response = await this.client.get('/reviews/admin/stats');
    return response.data;
  }

  async deleteReview(reviewId) {
    const response = await this.client.delete(`/reviews/${reviewId}`);
    return response.data;
  }

  // Reading analytics endpoints
  async getReadingAnalytics(params = {}) {
    const response = await this.client.get('/reading-progress/analytics', { params });
    return response.data;
  }

  async getTopReaders(params = {}) {
    const response = await this.client.get('/reading-progress/top-readers', { params });
    return response.data;
  }

  async getPopularBooks(params = {}) {
    const response = await this.client.get('/reading-progress/popular-books', { params });
    return response.data;
  }

  // Downloads endpoints
  async getMostDownloadedBooks(params = {}) {
    const response = await this.client.get('/downloads/most-downloaded', { params });
    return response.data;
  }

  async getDownloadStats(bookId) {
    const response = await this.client.get(`/downloads/stats/${bookId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
