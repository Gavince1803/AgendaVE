import { AuthService, AuthUser } from '@/lib/auth';
import { BookingService, type Employee } from '@/lib/booking-service';
import { NotificationService } from '@/lib/notification-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ActiveRole = 'client' | 'provider' | 'employee';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => Promise<void>;
  employeeProfile: Employee | null;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithCedula: (cedula: string, password: string) => Promise<void>;
  signInWithIdentifier: (identifier: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'client' | 'provider',
    phone?: string,
    businessInfo?: { businessName?: string; businessType?: string; address?: string },
    cedula?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<ActiveRole>('client');
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);

  const deriveActiveRole = (authUser: AuthUser | null, employee: any | null): ActiveRole => {
    if (authUser?.profile?.role === 'provider') return 'provider';
    if (employee) return 'employee';
    return 'client';
  };

  const persistActiveRole = async (role: ActiveRole) => {
    setActiveRoleState(role);
    try {
      await AsyncStorage.setItem('activeRole', role);
    } catch (err) {
      console.warn('⚠️ [AUTH CONTEXT] No se pudo guardar activeRole:', err);
    }
  };

  useEffect(() => {
    // Verificar sesión existente
    checkUser();
    // Restaurar activeRole persistido
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('activeRole');
        if (stored === 'client' || stored === 'provider' || stored === 'employee') {
          setActiveRoleState(stored);
        }
      } catch (err) {
        console.warn('⚠️ [AUTH CONTEXT] No se pudo restaurar activeRole:', err);
      }
    })();
  }, []);

  const checkUser = async () => {
    try {
      console.log('🔍 [AUTH CONTEXT] Verificando usuario actual...');
      const currentUser = await AuthService.getCurrentUser();
      console.log('🔍 [AUTH CONTEXT] Usuario obtenido:', currentUser?.email);
      console.log('🔍 [AUTH CONTEXT] Rol del usuario:', currentUser?.profile?.role);

      setUser(currentUser);
      const employee = currentUser ? await BookingService.getEmployeeProfile(currentUser.id) : null;
      console.log('🔍 [AUTH CONTEXT] Employee profile found:', employee ? 'Yes' : 'No', employee?.id);
      setEmployeeProfile(employee);

      // Restaurar o derivar rol activo
      const storedRole = await AsyncStorage.getItem('activeRole');
      let newRole: ActiveRole = 'client';

      if (storedRole && (storedRole === 'client' || storedRole === 'provider' || storedRole === 'employee')) {
        // Validar si el rol almacenado sigue siendo válido
        if (storedRole === 'provider' && currentUser?.profile?.role !== 'provider') {
          newRole = 'client';
        } else if (storedRole === 'employee' && !employee) {
          newRole = 'client';
        } else {
          newRole = storedRole as ActiveRole;
        }
      } else {
        // Si no hay rol guardado, derivarlo
        newRole = deriveActiveRole(currentUser, employee);
      }

      await persistActiveRole(newRole);

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
      const employee = currentUser ? await BookingService.getEmployeeProfile(currentUser.id) : null;
      setEmployeeProfile(employee);
      const derivedRole = deriveActiveRole(currentUser, employee);
      await persistActiveRole(derivedRole);

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

  const signInWithCedula = async (cedula: string, password: string) => {
    return signInWithIdentifier(cedula, password);
  };

  const signInWithIdentifier = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔍 [AUTH CONTEXT] Iniciando signInWithIdentifier para:', identifier);
      await AuthService.signInWithIdentifier(identifier, password);

      // Post-login logic is same as signIn
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      const employee = currentUser ? await BookingService.getEmployeeProfile(currentUser.id) : null;
      setEmployeeProfile(employee);
      const derivedRole = deriveActiveRole(currentUser, employee);
      await persistActiveRole(derivedRole);

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

  const signUp = async (email: string, password: string, fullName: string, role: 'client' | 'provider', phone?: string, businessInfo?: { businessName?: string, businessType?: string, address?: string }, cedula?: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, fullName, role, phone, businessInfo, cedula);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      const employee = currentUser ? await BookingService.getEmployeeProfile(currentUser.id) : null;
      setEmployeeProfile(employee);
      const derivedRole = deriveActiveRole(currentUser, employee);
      await persistActiveRole(derivedRole);
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
      setEmployeeProfile(null);
      await persistActiveRole('client');
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
      await checkUser();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    activeRole,
    setActiveRole: persistActiveRole,
    employeeProfile,
    refreshUser: checkUser,
    signIn,
    signInWithCedula,
    signInWithIdentifier,
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
