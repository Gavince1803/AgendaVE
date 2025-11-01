import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, Appointment, Service } from './booking-service';

// Storage keys
const STORAGE_KEYS = {
  PROVIDERS: '@agendave/providers',
  APPOINTMENTS: '@agendave/appointments',
  FAVORITES: '@agendave/favorites',
  SERVICES: '@agendave/services',
  SEARCH_HISTORY: '@agendave/search_history',
  SYNC_QUEUE: '@agendave/sync_queue',
  LAST_SYNC: '@agendave/last_sync',
  USER_PREFERENCES: '@agendave/user_preferences',
} as const;

// Types
export interface SyncQueueItem {
  id: string;
  type: 'favorite_add' | 'favorite_remove' | 'appointment_create' | 'appointment_update' | 'appointment_cancel';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  category?: string;
}

export interface UserPreferences {
  defaultCategory?: string;
  searchHistory: SearchHistoryItem[];
  favoriteProviderIds: string[];
  notificationSettings?: {
    enabled: boolean;
    reminderTime: number; // minutes before appointment
  };
}

export interface OfflineCache {
  providers: Provider[];
  appointments: Appointment[];
  favorites: string[];
  services: Service[];
  lastSync: number;
}

class OfflineStorageService {
  private syncQueue: SyncQueueItem[] = [];
  private isInitialized = false;

  /**
   * Initialize the offline storage service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load sync queue from storage
      await this.loadSyncQueue();
      this.isInitialized = true;
      console.log('[OfflineStorage] Initialized successfully');
    } catch (error) {
      console.error('[OfflineStorage] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if we have cached data
   */
  async hasCachedData(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync !== null;
    } catch (error) {
      console.error('[OfflineStorage] Error checking cached data:', error);
      return false;
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<number | null> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync, 10) : null;
    } catch (error) {
      console.error('[OfflineStorage] Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('[OfflineStorage] Error updating last sync time:', error);
    }
  }

  // ==================== PROVIDERS ====================

  /**
   * Cache providers to local storage
   */
  async cacheProviders(providers: Provider[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      await this.updateLastSyncTime();
      console.log(`[OfflineStorage] Cached ${providers.length} providers`);
    } catch (error) {
      console.error('[OfflineStorage] Error caching providers:', error);
      throw error;
    }
  }

  /**
   * Get cached providers
   */
  async getCachedProviders(): Promise<Provider[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
      if (!data) return [];
      
      const providers = JSON.parse(data);
      console.log(`[OfflineStorage] Retrieved ${providers.length} cached providers`);
      return providers;
    } catch (error) {
      console.error('[OfflineStorage] Error getting cached providers:', error);
      return [];
    }
  }

  // ==================== APPOINTMENTS ====================

  /**
   * Cache appointments to local storage
   */
  async cacheAppointments(appointments: Appointment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      await this.updateLastSyncTime();
      console.log(`[OfflineStorage] Cached ${appointments.length} appointments`);
    } catch (error) {
      console.error('[OfflineStorage] Error caching appointments:', error);
      throw error;
    }
  }

  /**
   * Get cached appointments
   */
  async getCachedAppointments(): Promise<Appointment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (!data) return [];
      
      const appointments = JSON.parse(data);
      console.log(`[OfflineStorage] Retrieved ${appointments.length} cached appointments`);
      return appointments;
    } catch (error) {
      console.error('[OfflineStorage] Error getting cached appointments:', error);
      return [];
    }
  }

  // ==================== FAVORITES ====================

  /**
   * Cache favorites to local storage
   */
  async cacheFavorites(favoriteIds: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoriteIds));
      console.log(`[OfflineStorage] Cached ${favoriteIds.length} favorites`);
    } catch (error) {
      console.error('[OfflineStorage] Error caching favorites:', error);
      throw error;
    }
  }

  /**
   * Get cached favorites
   */
  async getCachedFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!data) return [];
      
      const favorites = JSON.parse(data);
      console.log(`[OfflineStorage] Retrieved ${favorites.length} cached favorites`);
      return favorites;
    } catch (error) {
      console.error('[OfflineStorage] Error getting cached favorites:', error);
      return [];
    }
  }

  /**
   * Add favorite locally
   */
  async addFavoriteLocally(providerId: string): Promise<void> {
    try {
      const favorites = await this.getCachedFavorites();
      if (!favorites.includes(providerId)) {
        favorites.push(providerId);
        await this.cacheFavorites(favorites);
      }
    } catch (error) {
      console.error('[OfflineStorage] Error adding favorite locally:', error);
      throw error;
    }
  }

  /**
   * Remove favorite locally
   */
  async removeFavoriteLocally(providerId: string): Promise<void> {
    try {
      const favorites = await this.getCachedFavorites();
      const filtered = favorites.filter(id => id !== providerId);
      await this.cacheFavorites(filtered);
    } catch (error) {
      console.error('[OfflineStorage] Error removing favorite locally:', error);
      throw error;
    }
  }

  // ==================== SERVICES ====================

  /**
   * Cache services to local storage
   */
  async cacheServices(services: Service[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      console.log(`[OfflineStorage] Cached ${services.length} services`);
    } catch (error) {
      console.error('[OfflineStorage] Error caching services:', error);
      throw error;
    }
  }

  /**
   * Get cached services
   */
  async getCachedServices(): Promise<Service[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);
      if (!data) return [];
      
      const services = JSON.parse(data);
      console.log(`[OfflineStorage] Retrieved ${services.length} cached services`);
      return services;
    } catch (error) {
      console.error('[OfflineStorage] Error getting cached services:', error);
      return [];
    }
  }

  // ==================== SEARCH HISTORY ====================

  /**
   * Add search query to history
   */
  async addSearchHistory(query: string, category?: string): Promise<void> {
    try {
      if (!query.trim()) return;

      const preferences = await this.getUserPreferences();
      const history = preferences.searchHistory || [];
      
      // Remove duplicate if exists
      const filtered = history.filter(item => item.query !== query);
      
      // Add new search at the beginning
      filtered.unshift({
        query,
        category,
        timestamp: Date.now(),
      });
      
      // Keep only last 20 searches
      const limited = filtered.slice(0, 20);
      
      preferences.searchHistory = limited;
      await this.saveUserPreferences(preferences);
      
      console.log(`[OfflineStorage] Added search history: ${query}`);
    } catch (error) {
      console.error('[OfflineStorage] Error adding search history:', error);
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences.searchHistory || [];
    } catch (error) {
      console.error('[OfflineStorage] Error getting search history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences.searchHistory = [];
      await this.saveUserPreferences(preferences);
      console.log('[OfflineStorage] Cleared search history');
    } catch (error) {
      console.error('[OfflineStorage] Error clearing search history:', error);
    }
  }

  // ==================== USER PREFERENCES ====================

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!data) {
        return {
          searchHistory: [],
          favoriteProviderIds: [],
          notificationSettings: {
            enabled: true,
            reminderTime: 60, // 1 hour before
          },
        };
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('[OfflineStorage] Error getting user preferences:', error);
      return {
        searchHistory: [],
        favoriteProviderIds: [],
        notificationSettings: {
          enabled: true,
          reminderTime: 60,
        },
      };
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      console.log('[OfflineStorage] Saved user preferences');
    } catch (error) {
      console.error('[OfflineStorage] Error saving user preferences:', error);
      throw error;
    }
  }

  // ==================== SYNC QUEUE ====================

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queueItem: SyncQueueItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      this.syncQueue.push(queueItem);
      await this.saveSyncQueue();
      
      console.log(`[OfflineStorage] Added to sync queue: ${queueItem.type}`);
    } catch (error) {
      console.error('[OfflineStorage] Error adding to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    try {
      this.syncQueue = this.syncQueue.filter(item => item.id !== id);
      await this.saveSyncQueue();
      console.log(`[OfflineStorage] Removed from sync queue: ${id}`);
    } catch (error) {
      console.error('[OfflineStorage] Error removing from sync queue:', error);
      throw error;
    }
  }

  /**
   * Update retry count for sync queue item
   */
  async updateSyncQueueRetryCount(id: string): Promise<void> {
    try {
      const item = this.syncQueue.find(i => i.id === id);
      if (item) {
        item.retryCount += 1;
        await this.saveSyncQueue();
      }
    } catch (error) {
      console.error('[OfflineStorage] Error updating retry count:', error);
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    try {
      this.syncQueue = [];
      await this.saveSyncQueue();
      console.log('[OfflineStorage] Cleared sync queue');
    } catch (error) {
      console.error('[OfflineStorage] Error clearing sync queue:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (data) {
        this.syncQueue = JSON.parse(data);
        console.log(`[OfflineStorage] Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('[OfflineStorage] Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('[OfflineStorage] Error saving sync queue:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROVIDERS,
        STORAGE_KEYS.APPOINTMENTS,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.SERVICES,
        STORAGE_KEYS.LAST_SYNC,
      ]);
      console.log('[OfflineStorage] Cleared all cache');
    } catch (error) {
      console.error('[OfflineStorage] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{
    providersCount: number;
    appointmentsCount: number;
    favoritesCount: number;
    servicesCount: number;
    queueCount: number;
    lastSync: number | null;
  }> {
    try {
      const [providers, appointments, favorites, services, lastSync] = await Promise.all([
        this.getCachedProviders(),
        this.getCachedAppointments(),
        this.getCachedFavorites(),
        this.getCachedServices(),
        this.getLastSyncTime(),
      ]);

      return {
        providersCount: providers.length,
        appointmentsCount: appointments.length,
        favoritesCount: favorites.length,
        servicesCount: services.length,
        queueCount: this.syncQueue.length,
        lastSync,
      };
    } catch (error) {
      console.error('[OfflineStorage] Error getting storage info:', error);
      return {
        providersCount: 0,
        appointmentsCount: 0,
        favoritesCount: 0,
        servicesCount: 0,
        queueCount: 0,
        lastSync: null,
      };
    }
  }
}

// Export singleton instance
export const OfflineStorage = new OfflineStorageService();
