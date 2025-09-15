import { Database, supabase } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Provider = Database['public']['Tables']['providers']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export class AuthService {
  static async signUp(email: string, password: string, fullName: string, role: 'client' | 'provider', phone?: string, businessInfo?: { businessName?: string, businessType?: string, address?: string }) {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;

    // Crear perfil después del registro
    if (data.user) {
      console.log('🔴 [AUTH SERVICE] Creando perfil para usuario:', data.user.id);
      console.log('🔴 [AUTH SERVICE] Datos del perfil:', {
        id: data.user.id,
        display_name: fullName,
        role: role,
        phone: phone || null,
      });

      const { data: insertData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          display_name: fullName,
          role: role,
          phone: phone || null,
        })
        .select();

      if (profileError) {
        console.error('🔴 [AUTH SERVICE] ❌ Error creando perfil:', profileError);
        console.error('🔴 [AUTH SERVICE] ❌ Código de error:', profileError.code);
        console.error('🔴 [AUTH SERVICE] ❌ Mensaje:', profileError.message);
        console.error('🔴 [AUTH SERVICE] ❌ Detalles:', profileError.details);
        console.error('🔴 [AUTH SERVICE] ❌ Hint:', profileError.hint);
        throw profileError;
      } else {
        console.log('🔴 [AUTH SERVICE] ✅ Perfil creado exitosamente:', insertData);
        
        // Si es un proveedor, crear también el registro en la tabla providers
        if (role === 'provider') {
          console.log('🔴 [AUTH SERVICE] Creando registro de proveedor...');
          
          const { data: providerData, error: providerError } = await supabase
            .from('providers')
            .insert({
              owner_id: data.user.id,
              user_id: data.user.id,
              name: fullName,
              business_name: businessInfo?.businessName || fullName,
              category: businessInfo?.businessType || 'Otro',
              address: businessInfo?.address || null,
              is_active: true,
            })
            .select();
            
          if (providerError) {
            console.error('🔴 [AUTH SERVICE] ❌ Error creando proveedor:', providerError);
            // No lanzar error aquí para no romper el registro del usuario
          } else {
            console.log('🔴 [AUTH SERVICE] ✅ Proveedor creado exitosamente:', providerData);
          }
        }
      }
    }

    return data;
  }

  static async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    console.log('🔴 [AUTH SERVICE] Iniciando signOut...');
    console.log('🔴 [AUTH SERVICE] Verificando configuración de Supabase...');
    
    if (!supabase) {
      console.error('🔴 [AUTH SERVICE] ❌ Supabase no está configurado');
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }
    
    console.log('🔴 [AUTH SERVICE] ✅ Supabase configurado correctamente');
    console.log('🔴 [AUTH SERVICE] Llamando a supabase.auth.signOut()...');

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('🔴 [AUTH SERVICE] ❌ Error en supabase.auth.signOut():', error);
      console.error('🔴 [AUTH SERVICE] ❌ Código de error:', error.code);
      console.error('🔴 [AUTH SERVICE] ❌ Mensaje de error:', error.message);
      throw error;
    }
    
    console.log('🔴 [AUTH SERVICE] ✅ supabase.auth.signOut() completado exitosamente');
    console.log('🔴 [AUTH SERVICE] ✅ Proceso de signOut finalizado');
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    if (!supabase) {
      console.warn('Supabase no está configurado');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      profile,
    };
  }

  static async updateProfile(updates: Partial<Profile>) {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  }
}

