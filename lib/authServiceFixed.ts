// 🔧 Fixed Auth Service - Proper Session Management
// This fixes the profile creation issue by ensuring proper authentication

import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'client' | 'provider';
  phone?: string;
}

export class AuthServiceFixed {
  // ===== FIXED SIGN UP METHOD =====
  static async signUp(data: SignUpData) {
    try {
      console.log('🔴 [AUTH SERVICE] Iniciando signUp para:', data.email);
      console.log('🔴 [AUTH SERVICE] Datos del registro:', {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
      });

      // Step 1: Create user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            phone: data.phone || '',
          },
        },
      });

      if (signUpError) {
        console.log('🔴 [AUTH SERVICE] ❌ Error en signUp:', signUpError);
        throw signUpError;
      }

      console.log('🔴 [AUTH SERVICE] ✅ SignUp exitoso:', authData);

      if (!authData.user) {
        throw new Error('No user returned from signup');
      }

      // Step 2: Wait a moment for Supabase to process the user
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Create profile using service role client
      // This bypasses RLS for the initial profile creation
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          display_name: data.fullName,
          role: data.role,
          phone: data.phone || '',
        });

      if (profileError) {
        console.log('🔴 [AUTH SERVICE] ❌ Error creando perfil:', profileError);
        
        // If profile creation fails, try to clean up the auth user
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup user after profile creation error');
        }
        
        throw profileError;
      }

      console.log('🔴 [AUTH SERVICE] ✅ Perfil creado exitosamente');

      return {
        user: authData.user,
        session: authData.session,
        needsEmailConfirmation: !authData.session, // If no session, needs email confirmation
      };

    } catch (error) {
      console.log('🔴 [AUTH SERVICE] ❌ Error en signUp completo:', error);
      throw error;
    }
  }

  // ===== ALTERNATIVE: CREATE PROFILE AFTER EMAIL CONFIRMATION =====
  static async createProfileAfterConfirmation(userId: string, profileData: {
    email: string;
    fullName: string;
    role: string;
    phone?: string;
  }) {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: profileData.email,
          full_name: profileData.fullName,
          display_name: profileData.fullName,
          role: profileData.role,
          phone: profileData.phone || '',
        });

      if (error) throw error;
      
      console.log('✅ Profile created after email confirmation');
    } catch (error) {
      console.error('❌ Error creating profile after confirmation:', error);
      throw error;
    }
  }

  // ===== CHECK IF PROFILE EXISTS =====
  static async checkProfileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      return !!data && !error;
    } catch {
      return false;
    }
  }
}

export default AuthServiceFixed;