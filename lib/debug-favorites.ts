// Debug utilities for favorites functionality troubleshooting
// This file contains detailed logging functions to help identify issues with favorites operations
// Keep this file for future debugging purposes, but use regular BookingService functions in production

import { supabase } from './supabase';

export class DebugFavorites {
  
  // Debug function to check if provider is favorite with detailed logging
  static async debugIsProviderFavorite(providerId: string): Promise<boolean> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Starting isProviderFavorite check...');
      console.log('🔍 [DEBUG FAVORITES] Provider ID:', providerId);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('🔍 [DEBUG FAVORITES] Current user:', user?.id);
      console.log('🔍 [DEBUG FAVORITES] User error:', userError);
      
      if (!user) {
        console.log('🔍 [DEBUG FAVORITES] No user found, returning false');
        return false;
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 [DEBUG FAVORITES] Session exists:', !!session);
      console.log('🔍 [DEBUG FAVORITES] Session error:', sessionError);
      console.log('🔍 [DEBUG FAVORITES] Access token exists:', !!session?.access_token);

      // Try to query the table directly
      console.log('🔍 [DEBUG FAVORITES] Attempting to query user_favorites table...');
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .single();

      console.log('🔍 [DEBUG FAVORITES] Query data:', data);
      console.log('🔍 [DEBUG FAVORITES] Query error:', error);
      console.log('🔍 [DEBUG FAVORITES] Error code:', error?.code);
      console.log('🔍 [DEBUG FAVORITES] Error message:', error?.message);
      console.log('🔍 [DEBUG FAVORITES] Error details:', error?.details);
      console.log('🔍 [DEBUG FAVORITES] Error hint:', error?.hint);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.log('🔴 [DEBUG FAVORITES] Unexpected error:', error);
        throw error;
      }

      const isFavorite = !!data;
      console.log('🔍 [DEBUG FAVORITES] Is favorite result:', isFavorite);
      return isFavorite;
      
    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Exception in debugIsProviderFavorite:', error);
      return false;
    }
  }

  // Debug function to add to favorites with detailed logging
  static async debugAddToFavorites(providerId: string): Promise<void> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Starting addToFavorites...');
      console.log('🔍 [DEBUG FAVORITES] Provider ID:', providerId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔍 [DEBUG FAVORITES] User ID:', user.id);

      // Check if already in favorites
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .single();

      console.log('🔍 [DEBUG FAVORITES] Existing favorite:', existing);

      if (existing) {
        console.log('🔍 [DEBUG FAVORITES] Already in favorites, skipping');
        return;
      }

      console.log('🔍 [DEBUG FAVORITES] Attempting to insert favorite...');

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          provider_id: providerId
        })
        .select();

      console.log('🔍 [DEBUG FAVORITES] Insert data:', data);
      console.log('🔍 [DEBUG FAVORITES] Insert error:', error);

      if (error) {
        console.log('🔴 [DEBUG FAVORITES] Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ [DEBUG FAVORITES] Successfully added to favorites');

    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Exception in debugAddToFavorites:', error);
      throw error;
    }
  }

  // Debug function to remove from favorites with detailed logging
  static async debugRemoveFromFavorites(providerId: string): Promise<void> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Starting removeFromFavorites...');
      console.log('🔍 [DEBUG FAVORITES] Provider ID:', providerId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔍 [DEBUG FAVORITES] User ID:', user.id);

      console.log('🔍 [DEBUG FAVORITES] Attempting to delete favorite...');

      const { data, error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .select();

      console.log('🔍 [DEBUG FAVORITES] Delete data:', data);
      console.log('🔍 [DEBUG FAVORITES] Delete error:', error);

      if (error) {
        console.log('🔴 [DEBUG FAVORITES] Delete error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ [DEBUG FAVORITES] Successfully removed from favorites');

    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Exception in debugRemoveFromFavorites:', error);
      throw error;
    }
  }

  // Debug function to get favorite providers with detailed logging
  static async debugGetFavoriteProviders(): Promise<any[]> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Starting getFavoriteProviders...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 [DEBUG FAVORITES] No user found, returning empty array');
        return [];
      }

      console.log('🔍 [DEBUG FAVORITES] User ID:', user.id);

      console.log('🔍 [DEBUG FAVORITES] Querying favorite providers...');

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          provider_id,
          providers!inner (
            id,
            business_name,
            name,
            category,
            address,
            phone,
            rating,
            total_reviews,
            is_active,
            created_at
          )
        `)
        .eq('user_id', user.id);

      console.log('🔍 [DEBUG FAVORITES] Favorite providers query data:', data);
      console.log('🔍 [DEBUG FAVORITES] Favorite providers query error:', error);

      if (error) {
        console.log('🔴 [DEBUG FAVORITES] Query error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Transform the data to match the expected format
      const providers = data?.map((item: any) => item.providers) || [];
      console.log('✅ [DEBUG FAVORITES] Successfully retrieved favorite providers:', providers.length);
      return providers;

    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Exception in debugGetFavoriteProviders:', error);
      return [];
    }
  }

  // Debug function to get favorite statuses with detailed logging
  static async debugGetFavoriteStatuses(providerIds: string[]): Promise<Record<string, boolean>> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Starting getFavoriteStatuses...');
      console.log('🔍 [DEBUG FAVORITES] Provider IDs:', providerIds);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 [DEBUG FAVORITES] No user found, returning empty statuses');
        return {};
      }

      console.log('🔍 [DEBUG FAVORITES] User ID:', user.id);

      if (providerIds.length === 0) {
        console.log('🔍 [DEBUG FAVORITES] No provider IDs provided, returning empty object');
        return {};
      }

      console.log('🔍 [DEBUG FAVORITES] Querying favorite statuses...');

      const { data, error } = await supabase
        .from('user_favorites')
        .select('provider_id')
        .eq('user_id', user.id)
        .in('provider_id', providerIds);

      console.log('🔍 [DEBUG FAVORITES] Favorite statuses query data:', data);
      console.log('🔍 [DEBUG FAVORITES] Favorite statuses query error:', error);

      if (error) {
        console.log('🔴 [DEBUG FAVORITES] Query error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Create a map of provider ID to favorite status
      const statuses: Record<string, boolean> = {};
      const favoriteProviderIds = new Set(data?.map(item => item.provider_id) || []);
      
      providerIds.forEach(providerId => {
        statuses[providerId] = favoriteProviderIds.has(providerId);
      });

      console.log('✅ [DEBUG FAVORITES] Successfully retrieved favorite statuses:', statuses);
      return statuses;

    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Exception in debugGetFavoriteStatuses:', error);
      return {};
    }
  }

  // Test the Supabase connection and configuration
  static async testSupabaseConnection(): Promise<void> {
    try {
      console.log('🔍 [DEBUG FAVORITES] Testing Supabase connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('providers')
        .select('id')
        .limit(1);
        
      console.log('🔍 [DEBUG FAVORITES] Providers test - data:', data);
      console.log('🔍 [DEBUG FAVORITES] Providers test - error:', error);
      
      // Test auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🔍 [DEBUG FAVORITES] Auth test - user:', authData.user?.id);
      console.log('🔍 [DEBUG FAVORITES] Auth test - error:', authError);
      
      // Test user_favorites table existence
      const { data: favData, error: favError } = await supabase
        .from('user_favorites')
        .select('count')
        .limit(0);
        
      console.log('🔍 [DEBUG FAVORITES] Favorites table test - data:', favData);
      console.log('🔍 [DEBUG FAVORITES] Favorites table test - error:', favError);
      
    } catch (error) {
      console.error('🔴 [DEBUG FAVORITES] Connection test failed:', error);
    }
  }
}