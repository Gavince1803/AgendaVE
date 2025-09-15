/**
 * Sistema de logging centralizado para AgendaVE
 * Proporciona logs estructurados y manejo de errores
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogCategory {
  AUTH = 'AUTH',
  NAVIGATION = 'NAV',
  UI = 'UI',
  API = 'API',
  DATABASE = 'DB',
  BOOKING = 'BOOKING',
  SERVICE = 'SERVICE',
  USER_ACTION = 'ACTION',
}

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  screen?: string;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatLog(entry: LogEntry): string {
    const { level, category, message, data, timestamp, userId, screen } = entry;
    
    let logMessage = `[${timestamp}] ${level} [${category}]`;
    
    if (screen) {
      logMessage += ` [${screen}]`;
    }
    
    if (userId) {
      logMessage += ` [User: ${userId}]`;
    }
    
    logMessage += ` ${message}`;
    
    return logMessage;
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any, screen?: string, userId?: string) {
    if (!this.isDevelopment) return;

    const entry: LogEntry = {
      level,
      category,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId,
      screen,
    };

    const formattedMessage = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.log(`🔵 ${formattedMessage}`, data ? data : '');
        break;
      case LogLevel.INFO:
        console.log(`🟢 ${formattedMessage}`, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(`🟡 ${formattedMessage}`, data ? data : '');
        break;
      case LogLevel.ERROR:
        console.error(`🔴 ${formattedMessage}`, data ? data : '');
        break;
    }
  }

  // Métodos públicos
  debug(category: LogCategory, message: string, data?: any, screen?: string, userId?: string) {
    this.log(LogLevel.DEBUG, category, message, data, screen, userId);
  }

  info(category: LogCategory, message: string, data?: any, screen?: string, userId?: string) {
    this.log(LogLevel.INFO, category, message, data, screen, userId);
  }

  warn(category: LogCategory, message: string, data?: any, screen?: string, userId?: string) {
    this.log(LogLevel.WARN, category, message, data, screen, userId);
  }

  error(category: LogCategory, message: string, error?: any, screen?: string, userId?: string) {
    this.log(LogLevel.ERROR, category, message, error, screen, userId);
  }

  // Métodos específicos para acciones comunes
  userAction(action: string, data?: any, screen?: string, userId?: string) {
    this.info(LogCategory.USER_ACTION, `Usuario ejecutó: ${action}`, data, screen, userId);
  }

  navigation(from: string, to: string, userId?: string) {
    this.info(LogCategory.NAVIGATION, `Navegación: ${from} → ${to}`, { from, to }, undefined, userId);
  }

  apiCall(method: string, endpoint: string, data?: any, userId?: string) {
    this.info(LogCategory.API, `API Call: ${method} ${endpoint}`, data, undefined, userId);
  }

  apiError(method: string, endpoint: string, error: any, userId?: string) {
    this.error(LogCategory.API, `API Error: ${method} ${endpoint}`, error, undefined, userId);
  }

  authAction(action: string, data?: any, userId?: string) {
    this.info(LogCategory.AUTH, `Auth Action: ${action}`, data, undefined, userId);
  }

  authError(action: string, error: any, userId?: string) {
    this.error(LogCategory.AUTH, `Auth Error: ${action}`, error, undefined, userId);
  }

  bookingAction(action: string, data?: any, screen?: string, userId?: string) {
    this.info(LogCategory.BOOKING, `Booking Action: ${action}`, data, screen, userId);
  }

  bookingError(action: string, error: any, screen?: string, userId?: string) {
    this.error(LogCategory.BOOKING, `Booking Error: ${action}`, error, screen, userId);
  }

  serviceAction(action: string, data?: any, screen?: string, userId?: string) {
    this.info(LogCategory.SERVICE, `Service Action: ${action}`, data, screen, userId);
  }

  serviceError(action: string, error: any, screen?: string, userId?: string) {
    this.error(LogCategory.SERVICE, `Service Error: ${action}`, error, screen, userId);
  }

  databaseAction(action: string, data?: any, userId?: string) {
    this.info(LogCategory.DATABASE, `Database Action: ${action}`, data, undefined, userId);
  }

  databaseError(action: string, error: any, userId?: string) {
    this.error(LogCategory.DATABASE, `Database Error: ${action}`, error, undefined, userId);
  }
}

// Instancia singleton
export const logger = new Logger();

// Hook para usar el logger con contexto de usuario
export function useLogger(userId?: string) {
  return {
    debug: (category: LogCategory, message: string, data?: any, screen?: string) => 
      logger.debug(category, message, data, screen, userId),
    info: (category: LogCategory, message: string, data?: any, screen?: string) => 
      logger.info(category, message, data, screen, userId),
    warn: (category: LogCategory, message: string, data?: any, screen?: string) => 
      logger.warn(category, message, data, screen, userId),
    error: (category: LogCategory, message: string, error?: any, screen?: string) => 
      logger.error(category, message, error, screen, userId),
    userAction: (action: string, data?: any, screen?: string) => 
      logger.userAction(action, data, screen, userId),
    navigation: (from: string, to: string) => 
      logger.navigation(from, to, userId),
    apiCall: (method: string, endpoint: string, data?: any) => 
      logger.apiCall(method, endpoint, data, userId),
    apiError: (method: string, endpoint: string, error: any) => 
      logger.apiError(method, endpoint, error, userId),
    authAction: (action: string, data?: any) => 
      logger.authAction(action, data, userId),
    authError: (action: string, error: any) => 
      logger.authError(action, error, userId),
    bookingAction: (action: string, data?: any, screen?: string) => 
      logger.bookingAction(action, data, screen, userId),
    bookingError: (action: string, error: any, screen?: string) => 
      logger.bookingError(action, error, screen, userId),
    serviceAction: (action: string, data?: any, screen?: string) => 
      logger.serviceAction(action, data, screen, userId),
    serviceError: (action: string, error: any, screen?: string) => 
      logger.serviceError(action, error, screen, userId),
    databaseAction: (action: string, data?: any) => 
      logger.databaseAction(action, data, userId),
    databaseError: (action: string, error: any) => 
      logger.databaseError(action, error, userId),
  };
}
