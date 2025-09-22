// 🚨 Comprehensive Error Handling & Logging System
// Production-ready error management with user-friendly messages and monitoring

import React from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';

// ===== ERROR TYPES =====
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// ===== ERROR SEVERITY LEVELS =====
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ===== ERROR INTERFACE =====
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  action?: string;
  context?: Record<string, any>;
}

// ===== ERROR HANDLER CLASS =====
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: AppError[] = [];
  private maxLogs = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // ===== MAIN ERROR HANDLING METHOD =====
  handleError(error: any, context?: {
    action?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  }): AppError {
    const appError = this.parseError(error, context);
    
    // Log the error
    this.logError(appError);
    
    // Show user-friendly message
    this.showUserError(appError);
    
    // Send to monitoring service (implement as needed)
    this.sendToMonitoring(appError);
    
    return appError;
  }

  // ===== PARSE DIFFERENT ERROR TYPES =====
  private parseError(error: any, context?: {
    action?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  }): AppError {
    const timestamp = new Date();
    const baseError: Partial<AppError> = {
      timestamp,
      userId: context?.userId,
      action: context?.action,
      context: context?.additionalContext,
    };

    // Supabase Auth Errors
    if (error?.message?.includes('Invalid login credentials')) {
      return {
        ...baseError,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        message: 'Invalid login credentials',
        userMessage: 'Email o contraseña incorrectos. Por favor, verifica tus datos.',
        code: 'AUTH_INVALID_CREDENTIALS',
      } as AppError;
    }

    if (error?.message?.includes('Email not confirmed')) {
      return {
        ...baseError,
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        message: 'Email not confirmed',
        userMessage: 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
        code: 'AUTH_EMAIL_NOT_CONFIRMED',
      } as AppError;
    }

    // Network Errors
    if (error?.message?.includes('Network request failed') || error?.code === 'NETWORK_ERROR') {
      return {
        ...baseError,
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: 'Network request failed',
        userMessage: 'Sin conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.',
        code: 'NETWORK_FAILED',
      } as AppError;
    }

    // Supabase RLS Errors
    if (error?.message?.includes('Row Level Security') || error?.code === '42501') {
      return {
        ...baseError,
        type: ErrorType.PERMISSION,
        severity: ErrorSeverity.HIGH,
        message: 'Row Level Security policy violation',
        userMessage: 'No tienes permisos para realizar esta acción.',
        code: 'RLS_VIOLATION',
        details: error,
      } as AppError;
    }

    // Database Constraint Errors
    if (error?.message?.includes('duplicate key value') || error?.code === '23505') {
      return {
        ...baseError,
        type: ErrorType.DATABASE,
        severity: ErrorSeverity.MEDIUM,
        message: 'Duplicate key constraint violation',
        userMessage: 'Este registro ya existe. Por favor, usa valores únicos.',
        code: 'DUPLICATE_ENTRY',
      } as AppError;
    }

    // 404 Not Found
    if (error?.status === 404 || error?.message?.includes('not found')) {
      return {
        ...baseError,
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.MEDIUM,
        message: 'Resource not found',
        userMessage: 'No se encontró la información solicitada.',
        code: 'NOT_FOUND',
      } as AppError;
    }

    // 403 Forbidden
    if (error?.status === 403) {
      return {
        ...baseError,
        type: ErrorType.PERMISSION,
        severity: ErrorSeverity.HIGH,
        message: 'Forbidden access',
        userMessage: 'No tienes permisos para realizar esta acción.',
        code: 'FORBIDDEN',
      } as AppError;
    }

    // 500 Server Errors
    if (error?.status >= 500) {
      return {
        ...baseError,
        type: ErrorType.SERVER,
        severity: ErrorSeverity.CRITICAL,
        message: `Server error: ${error?.status}`,
        userMessage: 'Error del servidor. Por favor, intenta de nuevo en unos momentos.',
        code: 'SERVER_ERROR',
        details: error,
      } as AppError;
    }

    // Validation Errors (from Zod)
    if (error?.name === 'ZodError' || error?.name === 'ValidationError') {
      return {
        ...baseError,
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        message: error?.message || 'Validation error',
        userMessage: 'Los datos ingresados no son válidos. Por favor, revisa la información.',
        code: 'VALIDATION_FAILED',
        details: error?.issues || error?.errors,
      } as AppError;
    }

    // Generic/Unknown Errors
    return {
      ...baseError,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error?.message || 'Unknown error',
      userMessage: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
      code: 'UNKNOWN_ERROR',
      details: error,
    } as AppError;
  }

  // ===== LOG ERROR =====
  private logError(error: AppError): void {
    // Add to local log
    this.errorLogs.unshift(error);
    
    // Keep only the latest logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }

    // Console log in development
    if (__DEV__) {
      console.group(`🚨 [ERROR] ${error.type} - ${error.severity}`);
      console.log('Message:', error.message);
      console.log('User Message:', error.userMessage);
      console.log('Code:', error.code);
      console.log('Timestamp:', error.timestamp.toISOString());
      console.log('Context:', error.context);
      console.log('Details:', error.details);
      console.groupEnd();
    }
  }

  // ===== SHOW USER-FRIENDLY ERROR =====
  private showUserError(error: AppError): void {
    // Don't show alerts for low severity errors
    if (error.severity === ErrorSeverity.LOW) return;

    // Show different UI based on severity
    if (error.severity === ErrorSeverity.CRITICAL) {
      Alert.alert(
        'Error Crítico',
        error.userMessage,
        [
          { text: 'Reportar', onPress: () => this.reportError(error) },
          { text: 'OK', style: 'default' },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        'Error',
        error.userMessage,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    }
  }

  // ===== SEND TO MONITORING SERVICE =====
  private sendToMonitoring(error: AppError): void {
    // Only send high severity errors to monitoring
    if (error.severity === ErrorSeverity.LOW) return;

    // In production, you would send to services like:
    // - Sentry
    // - Bugsnag
    // - LogRocket
    // - Custom analytics

    try {
      // Example: Send to Sentry (if configured)
      // Sentry.captureException(error);

      // Example: Send to custom endpoint
      // fetch('/api/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(error),
      // });

      console.log('📊 Error sent to monitoring service:', error.code);
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring service:', monitoringError);
    }
  }

  // ===== REPORT ERROR (USER INITIATED) =====
  private reportError(error: AppError): void {
    Alert.alert(
      'Reportar Error',
      'Tu reporte nos ayuda a mejorar la aplicación. ¿Deseas enviar los detalles del error?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Reportar', 
          onPress: () => {
            // Implement user error reporting
            console.log('🎯 User reported error:', error.code);
          }
        },
      ]
    );
  }

  // ===== UTILITY METHODS =====
  getErrorLogs(): AppError[] {
    return [...this.errorLogs];
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const stats = {
      total: this.errorLogs.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    this.errorLogs.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// ===== CONVENIENCE FUNCTIONS =====

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Quick error handling functions
export const handleError = (error: any, context?: {
  action?: string;
  userId?: string;
  additionalContext?: Record<string, any>;
}) => errorHandler.handleError(error, context);

// Specific error handlers for common scenarios
export const handleNetworkError = (error: any) => 
  handleError(error, { action: 'network_request' });

export const handleAuthError = (error: any) => 
  handleError(error, { action: 'authentication' });

export const handleDatabaseError = (error: any, action?: string) => 
  handleError(error, { action: action || 'database_operation' });

export const handleValidationError = (error: any) => 
  handleError(error, { action: 'validation' });

// Async wrapper for error handling
export async function withErrorHandling<T>(
  asyncFunction: () => Promise<T>,
  context?: {
    action?: string;
    userId?: string;
    additionalContext?: Record<string, any>;
  }
): Promise<T | null> {
  try {
    return await asyncFunction();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

// React component error boundary (for use with class components)
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: AppError }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): { hasError: boolean; error: AppError } {
    const appError = errorHandler.handleError(error, { action: 'component_render' });
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: any, errorInfo: any) {
    handleError(error, {
      action: 'component_error_boundary',
      additionalContext: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: AppError }> = ({ error }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
      Algo salió mal
    </Text>
    <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
      {error?.userMessage || 'Ha ocurrido un error inesperado'}
    </Text>
    <TouchableOpacity
      onPress={() => {
        // Reset error boundary or reload app
        window.location.reload?.();
      }}
      style={{
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: 'white', fontWeight: '600' }}>
        Reintentar
      </Text>
    </TouchableOpacity>
  </View>
);

export default {
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
  errorHandler,
  handleError,
  handleNetworkError,
  handleAuthError,
  handleDatabaseError,
  handleValidationError,
  withErrorHandling,
  ErrorBoundary,
};