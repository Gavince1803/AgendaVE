import { AuthService, AuthUser } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'client' | 'provider',
    phone?: string,
    businessInfo?: { businessName?: string; businessType?: string; address?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión existente
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log('🔍 [AUTH CONTEXT] Verificando usuario actual...');
      const currentUser = await AuthService.getCurrentUser();
      console.log('🔍 [AUTH CONTEXT] Usuario obtenido:', currentUser?.email);
      console.log('🔍 [AUTH CONTEXT] Rol del usuario:', currentUser?.profile?.role);
      console.log('🔍 [AUTH CONTEXT] Profile completo:', currentUser?.profile);
      setUser(currentUser);
      
      // Registrar token de notificaciones si el usuario está autenticado
      if (currentUser) {
        try {
          await NotificationService.registerToken(currentUser.id);
        } catch (error) {
          console.error('Error registering notification token:', error);
          // No fallar la autenticación por error de notificaciones
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔍 [AUTH CONTEXT] Iniciando signIn para:', email);
      await AuthService.signIn(email, password);
      const currentUser = await AuthService.getCurrentUser();
      console.log('🔍 [AUTH CONTEXT] Usuario después de signIn:', currentUser?.email);
      console.log('🔍 [AUTH CONTEXT] Rol después de signIn:', currentUser?.profile?.role);
      setUser(currentUser);
      
      // Registrar token de notificaciones después del login
      if (currentUser) {
        try {
          await NotificationService.registerToken(currentUser.id);
        } catch (error) {
          console.error('Error registering notification token after sign in:', error);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'client' | 'provider', phone?: string, businessInfo?: { businessName?: string, businessType?: string, address?: string }) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, fullName, role, phone, businessInfo);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🔴 [AUTH CONTEXT] Iniciando signOut...');
    console.log('🔴 [AUTH CONTEXT] Usuario actual antes de cerrar:', user?.email || 'No hay usuario');
    
    try {
      console.log('🔴 [AUTH CONTEXT] Llamando a AuthService.signOut()...');
      await AuthService.signOut();
      console.log('🔴 [AUTH CONTEXT] ✅ AuthService.signOut() completado exitosamente');
      
      console.log('🔴 [AUTH CONTEXT] Limpiando estado del usuario...');
      setUser(null);
      console.log('🔴 [AUTH CONTEXT] ✅ Usuario limpiado del estado');
      
    } catch (error) {
      console.error('🔴 [AUTH CONTEXT] ❌ Error en signOut:', error);
      console.error('🔴 [AUTH CONTEXT] ❌ Tipo de error:', typeof error);
      console.error('🔴 [AUTH CONTEXT] ❌ Mensaje de error:', (error as any)?.message || String(error) || 'Sin mensaje');
      throw error;
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      await AuthService.updateProfile(updates);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
