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


  static async signInWithIdentifier(identifier: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    // 1. Determinar si parece un email
    if (identifier.includes('@')) {
      return this.signIn(identifier, password);
    }

    // 2. Si no es email, buscar email asociado al identificador (Cédula o Teléfono)
    const { data: email, error } = await supabase.rpc('get_email_by_identifier', {
      identifier_input: identifier
    });

    if (error) {
      console.error('Error looking up identifier:', error);
      // Si falla el RPC, intentar login directo por si acaso (aunque fallará si no es email)
      // O lanzar error específico
      throw new Error('Error verificando credenciales');
    }

    if (!email) {
      // Si no se encuentra email, lanzar error amigable
      throw new Error('Usuario no encontrado con esa Cédula o Teléfono');
    }

    // 3. Iniciar sesión con el email encontrado
    return this.signIn(email, password);
  }

  static async signInWithCedula(cedula: string, password: string) {
    return this.signInWithIdentifier(cedula, password);
  }

  static async signUp(email: string, password: string, fullName: string, role: 'client' | 'provider', phone?: string, businessInfo?: { businessName?: string, businessType?: string, address?: string }, cedula?: string) {
    if (!supabase) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }

    console.log('🔴 [AUTH SERVICE] Iniciando signUp para:', email);
    // console.log('🔴 [AUTH SERVICE] Datos del registro:', { email, fullName, role, phone, cedula });

    // Intentar signup simple sin confirmación de email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Deshabilitar redirección de email
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      console.error('🔴 [AUTH SERVICE] ❌ Error en signUp:', error);
      console.error('🔴 [AUTH SERVICE] ❌ Código:', error.message);
      console.error('🔴 [AUTH SERVICE] ❌ Detalles:', error);
      throw error;
    }

    console.log('🔴 [AUTH SERVICE] ✅ SignUp exitoso:', data);

    // Crear perfil inmediatamente (sin esperar confirmación de email)
    if (data.user) {
      console.log('🔴 [AUTH SERVICE] Creando perfil para usuario:', data.user.id);

      try {
        // Insertar en user_identifiers si hay cédula
        if (cedula) {
          const { error: idError } = await supabase
            .from('user_identifiers' as any)
            .insert({
              user_id: data.user.id,
              cedula: cedula,
              phone: phone || null,
              email: email // Cache email for easier lookup
            });

          if (idError) {
            console.error('🔴 [AUTH SERVICE] ❌ Error guardando cédula:', idError);
          }
        }

        const { data: insertData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            display_name: fullName,
            role: role,
            phone: phone || null,
          })
          .select();

        if (profileError) {
          console.error('🔴 [AUTH SERVICE] ❌ Error creando perfil:', profileError);
          // No lanzar error aquí, el usuario ya se creó
        } else {
          console.log('🔴 [AUTH SERVICE] ✅ Perfil creado exitosamente:', insertData);
        }
      } catch (profileError) {
        console.error('🔴 [AUTH SERVICE] ❌ Error inesperado creando perfil:', profileError);
      }

      // Si es un proveedor, crear también el registro en la tabla providers
      if (role === 'provider') {
        console.log('🔴 [AUTH SERVICE] Creando registro de proveedor...');

        try {
          const { data: providerData, error: providerError } = await supabase
            .from('providers')
            .insert({
              user_id: data.user.id,
              name: fullName,
              business_name: businessInfo?.businessName || fullName,
              category: businessInfo?.businessType || 'general',
              bio: '',
              address: businessInfo?.address || '',
              phone: phone || '',
              email: email,
              timezone: 'America/Caracas',
              rating: 0.0,
              total_reviews: 0,
              is_active: true,
            })
            .select();

          if (providerError) {
            console.error('🔴 [AUTH SERVICE] ❌ Error creando proveedor:', providerError);
            // No lanzar error aquí para no romper el registro del usuario
          } else {
            console.log('🔴 [AUTH SERVICE] ✅ Proveedor creado exitosamente:', providerData);
          }
        } catch (providerError) {
          console.error('🔴 [AUTH SERVICE] ❌ Error inesperado creando proveedor:', providerError);
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

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Si no existe el perfil, crear uno básico
    if (!profile) {
      console.log('🔴 [AUTH SERVICE] Perfil no encontrado, creando uno básico para:', user.email);
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          role: 'client', // Rol por defecto
          phone: null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return {
          id: user.id,
          email: user.email!,
          profile: null,
        };
      }

      profile = newProfile;
    }

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

