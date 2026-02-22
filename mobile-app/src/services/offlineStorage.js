import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineStorage {
  constructor() {
    this.STORAGE_KEYS = {
      BOOKS: 'cached_books',
      CATEGORIES: 'cached_categories',
      DOWNLOADS: 'cached_downloads',
      USER_PROFILE: 'cached_user_profile',
      SEARCH_HISTORY: 'search_history',
      FAVORITE_BOOKS: 'favorite_books',
      LAST_SYNC: 'last_sync_timestamp',
    };
  }

  // Generic methods
  async getItem(key) {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  async clearAll() {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Books caching
  async cacheBooks(books) {
    return this.setItem(this.STORAGE_KEYS.BOOKS, {
      data: books,
      timestamp: Date.now(),
    });
  }

  async getCachedBooks() {
    const cached = await this.getItem(this.STORAGE_KEYS.BOOKS);
    return cached?.data || [];
  }

  async cacheBook(book) {
    const books = await this.getCachedBooks();
    const existingIndex = books.findIndex(b => b.id === book.id);
    
    if (existingIndex >= 0) {
      books[existingIndex] = book;
    } else {
      books.push(book);
    }
    
    return this.cacheBooks(books);
  }

  async getCachedBook(bookId) {
    const books = await this.getCachedBooks();
    return books.find(book => book.id === bookId);
  }

  // Categories caching
  async cacheCategories(categories) {
    return this.setItem(this.STORAGE_KEYS.CATEGORIES, {
      data: categories,
      timestamp: Date.now(),
    });
  }

  async getCachedCategories() {
    const cached = await this.getItem(this.STORAGE_KEYS.CATEGORIES);
    return cached?.data || [];
  }

  // Downloads caching
  async cacheDownloads(downloads) {
    return this.setItem(this.STORAGE_KEYS.DOWNLOADS, {
      data: downloads,
      timestamp: Date.now(),
    });
  }

  async getCachedDownloads() {
    const cached = await this.getItem(this.STORAGE_KEYS.DOWNLOADS);
    return cached?.data || [];
  }

  async addDownloadToCache(download) {
    const downloads = await this.getCachedDownloads();
    const existingIndex = downloads.findIndex(d => d.id === download.id);
    
    if (existingIndex >= 0) {
      downloads[existingIndex] = download;
    } else {
      downloads.unshift(download);
    }
    
    return this.cacheDownloads(downloads);
  }

  // User profile caching
  async cacheUserProfile(profile) {
    return this.setItem(this.STORAGE_KEYS.USER_PROFILE, {
      data: profile,
      timestamp: Date.now(),
    });
  }

  async getCachedUserProfile() {
    const cached = await this.getItem(this.STORAGE_KEYS.USER_PROFILE);
    return cached?.data || null;
  }

  // Search history
  async addToSearchHistory(query) {
    if (!query || query.trim().length < 2) return false;
    
    const history = await this.getItem(this.STORAGE_KEYS.SEARCH_HISTORY) || [];
    const cleanQuery = query.trim().toLowerCase();
    
    // Remove if already exists
    const filteredHistory = history.filter(item => item.toLowerCase() !== cleanQuery);
    
    // Add to beginning
    filteredHistory.unshift(cleanQuery);
    
    // Keep only last 20 items
    const limitedHistory = filteredHistory.slice(0, 20);
    
    return this.setItem(this.STORAGE_KEYS.SEARCH_HISTORY, limitedHistory);
  }

  async getSearchHistory() {
    return this.getItem(this.STORAGE_KEYS.SEARCH_HISTORY) || [];
  }

  async clearSearchHistory() {
    return this.removeItem(this.STORAGE_KEYS.SEARCH_HISTORY);
  }

  // Favorite books
  async addToFavorites(bookId) {
    const favorites = await this.getItem(this.STORAGE_KEYS.FAVORITE_BOOKS) || [];
    if (!favorites.includes(bookId)) {
      favorites.push(bookId);
      return this.setItem(this.STORAGE_KEYS.FAVORITE_BOOKS, favorites);
    }
    return true;
  }

  async removeFromFavorites(bookId) {
    const favorites = await this.getItem(this.STORAGE_KEYS.FAVORITE_BOOKS) || [];
    const filteredFavorites = favorites.filter(id => id !== bookId);
    return this.setItem(this.STORAGE_KEYS.FAVORITE_BOOKS, filteredFavorites);
  }

  async getFavorites() {
    return this.getItem(this.STORAGE_KEYS.FAVORITE_BOOKS) || [];
  }

  async isFavorite(bookId) {
    const favorites = await this.getFavorites();
    return favorites.includes(bookId);
  }

  // Sync management
  async updateLastSync() {
    return this.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now());
  }

  async getLastSync() {
    return this.getItem(this.STORAGE_KEYS.LAST_SYNC) || 0;
  }

  // Storage management
  async getStorageSize() {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      let totalSize = 0;
      
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      }
      
      return totalSize; // Size in bytes
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  // Cache validation
  async isCacheValid(key, maxAge = 24 * 60 * 60 * 1000) { // Default 24 hours
    try {
      const cached = await this.getItem(key);
      if (!cached || !cached.timestamp) return false;
      
      const age = Date.now() - cached.timestamp;
      return age < maxAge;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  async cleanExpiredCache() {
    try {
      const keys = [this.STORAGE_KEYS.BOOKS, this.STORAGE_KEYS.CATEGORIES, this.STORAGE_KEYS.DOWNLOADS];
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const key of keys) {
        const isValid = await this.isCacheValid(key, maxAge);
        if (!isValid) {
          await this.removeItem(key);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorage();
