import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'agendave_cache_';
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

export class CacheService {
    static async set<T>(key: string, data: T): Promise<void> {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
        } catch (error) {
            console.warn('⚠️ [CACHE] Error setting cache key:', key, error);
        }
    }

    static async get<T>(key: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!value) return null;

            const item: CacheItem<T> = JSON.parse(value);
            const now = Date.now();

            if (now - item.timestamp > ttl) {
                // Cache expired, but we might still want to return it in offline scenarios
                // For now, we'll treat it as expired but the caller can decide logic
                // Actually, let's return it but maybe mark it? 
                // Simpler: just return null if expired for strict TTL, 
                // or caller can use a very long TTL for offline fallback.
                console.log(`⚠️ [CACHE] Key ${key} expired`);
                return null;
            }

            return item.data;
        } catch (error) {
            console.warn('⚠️ [CACHE] Error getting cache key:', key, error);
            return null;
        }
    }

    static async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        } catch (error) {
            console.warn('⚠️ [CACHE] Error removing cache key:', key, error);
        }
    }

    static async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const appKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(appKeys);
        } catch (error) {
            console.warn('⚠️ [CACHE] Error clearing cache:', error);
        }
    }
}
