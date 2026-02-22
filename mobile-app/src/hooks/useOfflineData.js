import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { syncService } from '../services/syncService';
import { useNetInfo } from '@react-native-community/netinfo';

export const useOfflineData = (dataType, params = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const netInfo = useNetInfo();

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let result = [];

      if (netInfo.isConnected && !forceRefresh) {
        // Try to get fresh data first
        try {
          switch (dataType) {
            case 'books':
              const booksResponse = await syncService.syncBooks();
              result = booksResponse || [];
              break;
            case 'categories':
              const categoriesResponse = await syncService.syncCategories();
              result = categoriesResponse || [];
              break;
            case 'downloads':
              const downloadsResponse = await syncService.syncDownloads();
              result = downloadsResponse || [];
              break;
            default:
              throw new Error(`Unknown data type: ${dataType}`);
          }
        } catch (fetchError) {
          console.log('Failed to fetch fresh data, using cache');
          // Fall back to cached data
        }
      }

      // If no fresh data or offline, use cached data
      if (result.length === 0) {
        switch (dataType) {
          case 'books':
            result = await offlineStorage.getCachedBooks();
            break;
          case 'categories':
            result = await offlineStorage.getCachedCategories();
            break;
          case 'downloads':
            result = await offlineStorage.getCachedDownloads();
            break;
        }
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }

      // Apply filters if provided
      if (params.filter) {
        result = result.filter(params.filter);
      }

      // Apply sort if provided
      if (params.sort) {
        result.sort(params.sort);
      }

      setData(result);
      
      // Update last sync time
      const syncTime = await offlineStorage.getLastSync();
      setLastSync(syncTime);
      
    } catch (err) {
      console.error(`Error loading ${dataType}:`, err);
      setError(err.message);
      
      // Try to load cached data as fallback
      try {
        let cachedData = [];
        switch (dataType) {
          case 'books':
            cachedData = await offlineStorage.getCachedBooks();
            break;
          case 'categories':
            cachedData = await offlineStorage.getCachedCategories();
            break;
          case 'downloads':
            cachedData = await offlineStorage.getCachedDownloads();
            break;
        }
        setData(cachedData);
        setIsOffline(true);
      } catch (cacheError) {
        console.error('Error loading cached data:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [dataType, params.filter, params.sort, netInfo.isConnected]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const sync = useCallback(async () => {
    if (!netInfo.isConnected) {
      return false;
    }
    return await syncService.syncAll();
  }, [netInfo.isConnected]);

  return {
    data,
    loading,
    error,
    isOffline,
    lastSync,
    refresh,
    sync,
    isConnected: netInfo.isConnected,
  };
};

export const useOfflineBook = (bookId) => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const netInfo = useNetInfo();

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let bookData = null;

      if (netInfo.isConnected) {
        try {
          // Try to get fresh book data
          const { book: freshBook } = await syncService.apiService.getBook(bookId);
          if (freshBook) {
            bookData = freshBook;
            await offlineStorage.cacheBook(freshBook);
          }
        } catch (fetchError) {
          console.log('Failed to fetch fresh book data, using cache');
        }
      }

      // If no fresh data or offline, use cached data
      if (!bookData) {
        bookData = await offlineStorage.getCachedBook(bookId);
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }

      setBook(bookData);
    } catch (err) {
      console.error('Error loading book:', err);
      setError(err.message);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [bookId, netInfo.isConnected]);

  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId, loadBook]);

  return {
    book,
    loading,
    error,
    isOffline,
    refresh: loadBook,
  };
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const searchHistory = await offlineStorage.getSearchHistory();
      setHistory(searchHistory);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  const addToHistory = useCallback(async (query) => {
    try {
      await offlineStorage.addToSearchHistory(query);
      await loadHistory();
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    try {
      await offlineStorage.clearSearchHistory();
      setHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    addToHistory,
    clearHistory,
  };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const favoriteIds = await offlineStorage.getFavorites();
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToFavorites = useCallback(async (bookId) => {
    try {
      await offlineStorage.addToFavorites(bookId);
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }, [loadFavorites]);

  const removeFromFavorites = useCallback(async (bookId) => {
    try {
      await offlineStorage.removeFromFavorites(bookId);
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }, [loadFavorites]);

  const isFavorite = useCallback(async (bookId) => {
    try {
      return await offlineStorage.isFavorite(bookId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refresh: loadFavorites,
  };
};
