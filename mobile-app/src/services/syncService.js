import { apiService } from './supabase';
import { offlineStorage } from './offlineStorage';
import Toast from 'react-native-toast-message';

class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.syncQueue = [];
    
    // Listen for network changes
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    // In a real app, you would use @react-native-community/netinfo
    // For now, we'll assume online status
    this.isOnline = true;
  }

  async syncAll() {
    if (this.syncInProgress || !this.isOnline) {
      return false;
    }

    try {
      this.syncInProgress = true;
      
      // Sync books
      await this.syncBooks();
      
      // Sync categories
      await this.syncCategories();
      
      // Sync downloads
      await this.syncDownloads();
      
      // Process any queued actions
      await this.processSyncQueue();
      
      // Update last sync timestamp
      await offlineStorage.updateLastSync();
      
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: 'Your data has been synchronized',
      });
      
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Could not synchronize data',
      });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncBooks() {
    try {
      // Get fresh books from server
      const { books } = await apiService.getBooks({ limit: 100 });
      
      // Cache books locally
      await offlineStorage.cacheBooks(books);
      
      console.log(`Synced ${books.length} books`);
      return books;
    } catch (error) {
      console.error('Error syncing books:', error);
      throw error;
    }
  }

  async syncCategories() {
    try {
      // Get fresh categories from server
      const { categories } = await apiService.getCategories();
      
      // Cache categories locally
      await offlineStorage.cacheCategories(categories);
      
      console.log(`Synced ${categories.length} categories`);
      return categories;
    } catch (error) {
      console.error('Error syncing categories:', error);
      throw error;
    }
  }

  async syncDownloads() {
    try {
      // Get fresh downloads from server
      const { downloads } = await apiService.getDownloadHistory({ limit: 50 });
      
      // Cache downloads locally
      await offlineStorage.cacheDownloads(downloads);
      
      console.log(`Synced ${downloads.length} downloads`);
      return downloads;
    } catch (error) {
      console.error('Error syncing downloads:', error);
      throw error;
    }
  }

  async queueAction(action) {
    try {
      this.syncQueue.push({
        ...action,
        timestamp: Date.now(),
        id: Date.now() + Math.random(),
      });
      
      // Save queue to storage
      await offlineStorage.setItem('sync_queue', this.syncQueue);
      
      console.log('Queued action:', action.type);
      return true;
    } catch (error) {
      console.error('Error queuing action:', error);
      return false;
    }
  }

  async processSyncQueue() {
    try {
      // Load queue from storage
      const savedQueue = await offlineStorage.getItem('sync_queue');
      if (savedQueue) {
        this.syncQueue = savedQueue;
      }
      
      if (this.syncQueue.length === 0) {
        return true;
      }
      
      console.log(`Processing ${this.syncQueue.length} queued actions`);
      
      const failedActions = [];
      
      for (const action of this.syncQueue) {
        try {
          await this.processQueuedAction(action);
        } catch (error) {
          console.error('Failed to process action:', action, error);
          failedActions.push(action);
        }
      }
      
      // Update queue with failed actions only
      this.syncQueue = failedActions;
      await offlineStorage.setItem('sync_queue', this.syncQueue);
      
      console.log(`Sync queue processed. ${failedActions.length} actions failed`);
      return failedActions.length === 0;
    } catch (error) {
      console.error('Error processing sync queue:', error);
      return false;
    }
  }

  async processQueuedAction(action) {
    switch (action.type) {
      case 'download':
        // Record download on server
        await apiService.recordDownload(action.bookId);
        break;
      
      case 'favorite':
        // Sync favorite status (if you have this feature)
        // await apiService.updateFavorite(action.bookId, action.isFavorite);
        break;
      
      case 'search':
        // Sync search history (if you want to track this)
        break;
      
      default:
        console.warn('Unknown queued action type:', action.type);
    }
  }

  async getOfflineBooks() {
    try {
      const books = await offlineStorage.getCachedBooks();
      return books;
    } catch (error) {
      console.error('Error getting offline books:', error);
      return [];
    }
  }

  async getOfflineCategories() {
    try {
      const categories = await offlineStorage.getCachedCategories();
      return categories;
    } catch (error) {
      console.error('Error getting offline categories:', error);
      return [];
    }
  }

  async getOfflineDownloads() {
    try {
      const downloads = await offlineStorage.getCachedDownloads();
      return downloads;
    } catch (error) {
      console.error('Error getting offline downloads:', error);
      return [];
    }
  }

  async isDataAvailableOffline() {
    try {
      const books = await this.getOfflineBooks();
      const categories = await this.getOfflineCategories();
      
      return books.length > 0 && categories.length > 0;
    } catch (error) {
      return false;
    }
  }

  async forceRefresh() {
    try {
      // Clear cache and sync fresh data
      await offlineStorage.removeItem(offlineStorage.STORAGE_KEYS.BOOKS);
      await offlineStorage.removeItem(offlineStorage.STORAGE_KEYS.CATEGORIES);
      await offlineStorage.removeItem(offlineStorage.STORAGE_KEYS.DOWNLOADS);
      
      return await this.syncAll();
    } catch (error) {
      console.error('Error force refreshing:', error);
      return false;
    }
  }

  async getSyncStatus() {
    try {
      const lastSync = await offlineStorage.getLastSync();
      const queueLength = this.syncQueue.length;
      
      return {
        lastSync,
        queueLength,
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        hasOfflineData: await this.isDataAvailableOffline(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: 0,
        queueLength: 0,
        isOnline: false,
        syncInProgress: false,
        hasOfflineData: false,
      };
    }
  }

  // Auto-sync on app start
  async autoSync() {
    if (!this.isOnline) {
      console.log('Offline - skipping auto sync');
      return false;
    }

    try {
      const lastSync = await offlineStorage.getLastSync();
      const now = Date.now();
      const syncInterval = 30 * 60 * 1000; // 30 minutes
      
      // Auto sync if last sync was more than 30 minutes ago
      if (now - lastSync > syncInterval) {
        console.log('Auto-syncing data...');
        return await this.syncAll();
      }
      
      return true;
    } catch (error) {
      console.error('Auto-sync error:', error);
      return false;
    }
  }

  // Background sync (would be used with background tasks)
  async backgroundSync() {
    if (!this.isOnline || this.syncInProgress) {
      return false;
    }

    try {
      // Only process queue in background to save data
      await this.processSyncQueue();
      await offlineStorage.updateLastSync();
      
      return true;
    } catch (error) {
      console.error('Background sync error:', error);
      return false;
    }
  }
}

export const syncService = new SyncService();
