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
  static async signUp(email: string, password: string, fullName: string, role: 'client' | 'provider') {
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: role,
        });

      if (profileError) throw profileError;
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
    if (!supabase) {
      throw new Error('Supabase no está configurado. Por favor configura las credenciales en el archivo .env');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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

