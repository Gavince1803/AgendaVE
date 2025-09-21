// 🛡️ Rate Limiting and Security Measures
// Client-side protection against abuse and spam

import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== RATE LIMITING STORAGE KEYS =====
const RATE_LIMIT_PREFIX = 'rl_';
const FAILED_ATTEMPTS_PREFIX = 'fa_';

// ===== RATE LIMITING RULES =====
interface RateLimitRule {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export const RATE_LIMITS: Record<string, RateLimitRule> = {
  // Authentication
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  
  // Service Management  
  createService: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 services per hour
  updateService: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }, // 20 updates per hour
  deleteService: { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 deletes per hour
  
  // Booking
  createBooking: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 bookings per hour
  cancelBooking: { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 cancellations per hour
  
  // Reviews
  createReview: { maxAttempts: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 reviews per day
  
  // Search and Browse
  search: { maxAttempts: 100, windowMs: 60 * 60 * 1000 }, // 100 searches per hour
  
  // Favorites
  addFavorite: { maxAttempts: 50, windowMs: 60 * 60 * 1000 }, // 50 favorites per hour
  removeFavorite: { maxAttempts: 50, windowMs: 60 * 60 * 1000 }, // 50 removals per hour
  
  // Generic API calls
  apiCall: { maxAttempts: 200, windowMs: 60 * 60 * 1000 }, // 200 API calls per hour
};

// ===== ATTEMPT TRACKING =====
interface AttemptRecord {
  timestamp: number;
  count: number;
  blocked?: boolean;
  blockUntil?: number;
}

export class RateLimiter {
  // ===== CHECK IF ACTION IS ALLOWED =====
  static async canAttempt(action: string, customRule?: RateLimitRule): Promise<boolean> {
    const rule = customRule || RATE_LIMITS[action] || RATE_LIMITS.apiCall;
    const key = RATE_LIMIT_PREFIX + action;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      const record: AttemptRecord = stored ? JSON.parse(stored) : { timestamp: 0, count: 0 };
      const now = Date.now();
      
      // Check if currently blocked
      if (record.blocked && record.blockUntil && now < record.blockUntil) {
        console.warn(`🚫 Rate limit blocked for ${action} until ${new Date(record.blockUntil).toLocaleTimeString()}`);
        return false;
      }
      
      // Reset counter if window expired
      if (now - record.timestamp > rule.windowMs) {
        record.timestamp = now;
        record.count = 0;
        record.blocked = false;
        record.blockUntil = undefined;
      }
      
      // Check if limit exceeded
      if (record.count >= rule.maxAttempts) {
        // Block if block duration is specified
        if (rule.blockDurationMs) {
          record.blocked = true;
          record.blockUntil = now + rule.blockDurationMs;
          await AsyncStorage.setItem(key, JSON.stringify(record));
          console.warn(`🚫 Rate limit exceeded for ${action}. Blocked for ${rule.blockDurationMs / 1000 / 60} minutes.`);
          return false;
        }
        
        console.warn(`🚫 Rate limit exceeded for ${action}. Try again later.`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Rate limiting check failed:', error);
      return true; // Allow on error to prevent blocking legitimate users
    }
  }
  
  // ===== RECORD AN ATTEMPT =====
  static async recordAttempt(action: string, success: boolean = true): Promise<void> {
    const rule = RATE_LIMITS[action] || RATE_LIMITS.apiCall;
    const key = RATE_LIMIT_PREFIX + action;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      const record: AttemptRecord = stored ? JSON.parse(stored) : { timestamp: Date.now(), count: 0 };
      const now = Date.now();
      
      // Reset counter if window expired
      if (now - record.timestamp > rule.windowMs) {
        record.timestamp = now;
        record.count = 0;
        record.blocked = false;
        record.blockUntil = undefined;
      }
      
      // Increment counter
      record.count += 1;
      
      // If this is a failed attempt for authentication, track separately
      if (!success && ['login', 'register'].includes(action)) {
        await this.recordFailedAttempt(action);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(record));
      
      if (__DEV__) {
        console.log(`📊 Rate limit: ${action} = ${record.count}/${rule.maxAttempts}`);
      }
    } catch (error) {
      console.warn('Failed to record rate limit attempt:', error);
    }
  }
  
  // ===== RECORD FAILED ATTEMPTS =====
  private static async recordFailedAttempt(action: string): Promise<void> {
    const key = FAILED_ATTEMPTS_PREFIX + action;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      const attempts: number[] = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      // Remove attempts older than 1 hour
      const recentAttempts = attempts.filter(timestamp => now - timestamp < oneHour);
      
      // Add current attempt
      recentAttempts.push(now);
      
      await AsyncStorage.setItem(key, JSON.stringify(recentAttempts));
      
      // Warn if too many failed attempts
      if (recentAttempts.length >= 3) {
        console.warn(`⚠️ Multiple failed ${action} attempts detected`);
      }
    } catch (error) {
      console.warn('Failed to record failed attempt:', error);
    }
  }
  
  // ===== GET REMAINING ATTEMPTS =====
  static async getRemainingAttempts(action: string): Promise<number> {
    const rule = RATE_LIMITS[action] || RATE_LIMITS.apiCall;
    const key = RATE_LIMIT_PREFIX + action;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return rule.maxAttempts;
      
      const record: AttemptRecord = JSON.parse(stored);
      const now = Date.now();
      
      // Reset if window expired
      if (now - record.timestamp > rule.windowMs) {
        return rule.maxAttempts;
      }
      
      return Math.max(0, rule.maxAttempts - record.count);
    } catch (error) {
      return rule.maxAttempts;
    }
  }
  
  // ===== GET TIME UNTIL RESET =====
  static async getTimeUntilReset(action: string): Promise<number> {
    const rule = RATE_LIMITS[action] || RATE_LIMITS.apiCall;
    const key = RATE_LIMIT_PREFIX + action;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return 0;
      
      const record: AttemptRecord = JSON.parse(stored);
      const now = Date.now();
      
      // Check if blocked
      if (record.blocked && record.blockUntil) {
        return Math.max(0, record.blockUntil - now);
      }
      
      // Time until window resets
      const resetTime = record.timestamp + rule.windowMs;
      return Math.max(0, resetTime - now);
    } catch (error) {
      return 0;
    }
  }
  
  // ===== CLEAR ALL RATE LIMITS =====
  static async clearAllLimits(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rateLimitKeys = keys.filter(key => 
        key.startsWith(RATE_LIMIT_PREFIX) || 
        key.startsWith(FAILED_ATTEMPTS_PREFIX)
      );
      
      if (rateLimitKeys.length > 0) {
        await AsyncStorage.multiRemove(rateLimitKeys);
        console.log('🧹 All rate limits cleared');
      }
    } catch (error) {
      console.warn('Failed to clear rate limits:', error);
    }
  }
  
  // ===== SECURITY ANALYSIS =====
  static async getSecurityReport(): Promise<{
    suspiciousActivity: boolean;
    failedAttempts: Record<string, number>;
    blockedActions: string[];
    recommendations: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const failedKeys = keys.filter(key => key.startsWith(FAILED_ATTEMPTS_PREFIX));
      const rateLimitKeys = keys.filter(key => key.startsWith(RATE_LIMIT_PREFIX));
      
      const failedAttempts: Record<string, number> = {};
      const blockedActions: string[] = [];
      const now = Date.now();
      
      // Analyze failed attempts
      for (const key of failedKeys) {
        const action = key.replace(FAILED_ATTEMPTS_PREFIX, '');
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const attempts: number[] = JSON.parse(stored);
          const recentAttempts = attempts.filter(timestamp => now - timestamp < 60 * 60 * 1000);
          failedAttempts[action] = recentAttempts.length;
        }
      }
      
      // Analyze blocked actions
      for (const key of rateLimitKeys) {
        const action = key.replace(RATE_LIMIT_PREFIX, '');
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const record: AttemptRecord = JSON.parse(stored);
          if (record.blocked && record.blockUntil && now < record.blockUntil) {
            blockedActions.push(action);
          }
        }
      }
      
      // Determine if suspicious activity
      const totalFailedAttempts = Object.values(failedAttempts).reduce((sum, count) => sum + count, 0);
      const suspiciousActivity = totalFailedAttempts > 5 || blockedActions.length > 0;
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (totalFailedAttempts > 3) {
        recommendations.push('Consider enabling two-factor authentication');
      }
      if (blockedActions.length > 0) {
        recommendations.push('Some actions are temporarily blocked due to rate limits');
      }
      if (failedAttempts.login > 2) {
        recommendations.push('Multiple failed login attempts detected');
      }
      
      return {
        suspiciousActivity,
        failedAttempts,
        blockedActions,
        recommendations,
      };
    } catch (error) {
      console.warn('Failed to generate security report:', error);
      return {
        suspiciousActivity: false,
        failedAttempts: {},
        blockedActions: [],
        recommendations: [],
      };
    }
  }
}

// ===== CONVENIENCE FUNCTIONS =====
export const canAttempt = (action: string, customRule?: RateLimitRule) => 
  RateLimiter.canAttempt(action, customRule);

export const recordAttempt = (action: string, success: boolean = true) => 
  RateLimiter.recordAttempt(action, success);

export const getRemainingAttempts = (action: string) => 
  RateLimiter.getRemainingAttempts(action);

// ===== RATE LIMITED WRAPPER =====
export const withRateLimit = async <T>(
  action: string,
  asyncFunction: () => Promise<T>,
  customRule?: RateLimitRule
): Promise<T | null> => {
  const allowed = await canAttempt(action, customRule);
  
  if (!allowed) {
    const remaining = await RateLimiter.getTimeUntilReset(action);
    const minutes = Math.ceil(remaining / (60 * 1000));
    
    throw new Error(
      minutes > 0 
        ? `Demasiados intentos. Intenta de nuevo en ${minutes} minuto(s).`
        : 'Demasiados intentos. Intenta de nuevo más tarde.'
    );
  }
  
  try {
    const result = await asyncFunction();
    await recordAttempt(action, true);
    return result;
  } catch (error) {
    await recordAttempt(action, false);
    throw error;
  }
};

export default {
  RateLimiter,
  RATE_LIMITS,
  canAttempt,
  recordAttempt,
  getRemainingAttempts,
  withRateLimit,
};