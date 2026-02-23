// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://library-0nk4.onrender.com'

// API Endpoints
export const API_ENDPOINTS = {
  // Books
  BOOKS: `${API_BASE_URL}/api/books`,
  BOOK_DETAIL: (id: string) => `${API_BASE_URL}/api/books/${id}`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Reviews
  REVIEWS: `${API_BASE_URL}/api/reviews`,
  BOOK_REVIEWS: (bookId: string) => `${API_BASE_URL}/api/reviews/book/${bookId}`,
  
  // Bookmarks
  BOOKMARKS: `${API_BASE_URL}/api/bookmarks`,
  
  // Downloads
  DOWNLOADS: `${API_BASE_URL}/api/downloads`,
  
  // Reading Progress
  READING_PROGRESS: `${API_BASE_URL}/api/reading-progress`,
}
