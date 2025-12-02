import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing! Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
} else {
  console.log('✅ Supabase configuration found');
}

// Configurar storage según la plataforma
const getStorage = () => {
  if (Platform.OS === 'web') {
    // Para web, usar localStorage
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  }
  // Para móvil, usar AsyncStorage
  return AsyncStorage;
};

// Crear cliente de Supabase solo si las credenciales están configuradas
console.log('🔴 [SUPABASE] Creando cliente de Supabase...');
console.log('🔴 [SUPABASE] supabaseUrl disponible:', !!supabaseUrl);
console.log('🔴 [SUPABASE] supabaseAnonKey disponible:', !!supabaseAnonKey);

// Use a placeholder URL if missing to prevent crash, but auth will fail
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder';

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

const urlToUse = isValidUrl(supabaseUrl || '') ? supabaseUrl : fallbackUrl;
const keyToUse = supabaseAnonKey || fallbackKey;

export const supabase = createClient(urlToUse!, keyToUse, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (supabase) {
  console.log('🔴 [SUPABASE] ✅ Cliente de Supabase creado exitosamente');
} else {
  console.error('🔴 [SUPABASE] ❌ No se pudo crear el cliente de Supabase');
}

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          display_name: string | null;
          role: 'client' | 'provider' | 'admin';
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          display_name?: string | null;
          role?: 'client' | 'provider' | 'admin';
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          display_name?: string | null;
          role?: 'client' | 'provider' | 'admin';
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          owner_id: string;
          user_id?: string;
          name: string;
          business_name?: string;
          bio: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          website: string | null;
          lat: number | null;
          lng: number | null;
          timezone: string;
          category: string;
          rating: number | null;
          total_reviews: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          user_id?: string;
          name: string;
          business_name?: string;
          bio?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          website?: string | null;
          lat?: number | null;
          lng?: number | null;
          timezone?: string;
          category: string;
          rating?: number | null;
          total_reviews?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          user_id?: string;
          name?: string;
          business_name?: string;
          bio?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          website?: string | null;
          lat?: number | null;
          lng?: number | null;
          timezone?: string;
          category?: string;
          rating?: number | null;
          total_reviews?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price_amount: number;
          price_currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price_amount: number;
          price_currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price_amount?: number;
          price_currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      availabilities: {
        Row: {
          id: string;
          provider_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          provider_id: string;
          service_id: string;
          appointment_date: string;
          appointment_time: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'done';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          provider_id: string;
          service_id: string;
          appointment_date: string;
          appointment_time: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'done';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          provider_id?: string;
          service_id?: string;
          appointment_date?: string;
          appointment_time?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'done';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          client_id: string;
          provider_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          client_id: string;
          provider_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          client_id?: string;
          provider_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      device_push_tokens: {
        Row: {
          id: string;
          user_id: string;
          expo_token: string;
          token?: string;
          platform?: string;
          is_active?: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          expo_token: string;
          token?: string;
          platform?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          expo_token?: string;
          token?: string;
          platform?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
