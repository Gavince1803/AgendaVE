// 📅 Servicio de Reservas y Gestión de Citas
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { CacheService } from './cache-service';
import { NotificationService } from './notification-service';
import { supabase } from './supabase';

const ACTIVE_FEATURE_FLAGS = (process.env.EXPO_PUBLIC_FEATURE_FLAGS || '')
  .split(',')
  .map((flag: string) => flag.trim())
  .filter((flag: string) => flag.length > 0);

const LOYALTY_REWARD_STEP = 100;
const INVITE_TOKEN_TTL_HOURS = 48;

export interface Provider {
  id: string;
  user_id: string;
  name: string;
  business_name?: string;
  bio?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;

  lat?: number;
  lng?: number;
  timezone: string;
  category: string;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tagline?: string;
  mission?: string;
  hero_image_url?: string;
  cover_video_url?: string;
  specialties?: string[];
  loyalty_enabled?: boolean;
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  description?: string;
  price_amount: number;
  price_currency: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  provider_id: string;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  provider_id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  profile_id?: string | null;
  invite_email?: string | null;
  invite_status?: 'draft' | 'pending' | 'accepted' | 'revoked';
  invite_token?: string | null;
  invite_token_expires_at?: string | null;
  role?: string;
  is_active: boolean;
  is_owner: boolean;
  profile_image_url?: string;
  custom_schedule_enabled: boolean;
  bio?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name?: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  employee_id?: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'no_show';
  payment_status: 'pending' | 'paid' | 'partial';
  payment_method?: 'cash' | 'zelle' | 'pago_movil' | 'card' | 'other';
  note?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: Service;
  services?: Service;
  provider?: Provider;
  providers?: Provider;
  employee?: Employee;
  client?: {
    id: string;
    full_name?: string;
    display_name?: string;
    phone?: string;
  };
  profiles?: {
    display_name?: string;
    phone?: string;
  };
}

export interface Review {
  id: string;
  appointment_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  is_verified?: boolean;
  tags?: string[];
  highlight?: string;
  // Joined data
  client?: {
    id: string;
    full_name?: string;
    display_name?: string;
  };
  service?: Service;
}

export interface ProviderMedia {
  id: string;
  provider_id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  tags?: string[] | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export interface ProviderTeamMember {
  id: string;
  provider_id: string;
  full_name: string;
  role?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  expertise?: string[] | null;
  spotlight?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProviderHighlight {
  id: string;
  provider_id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  badge?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProviderLoyaltyActivity {
  id: string;
  provider_id: string;
  client_id: string;
  points_change: number;
  reason?: string | null;
  source?: string | null;
  created_at: string;
}

export interface ProviderLoyaltySummary {
  pointsBalance: number;
  tier: string;
  totalEarned: number;
  totalRedeemed: number;
  nextRewardAt: number;
  pointsToNextReward: number;
  recentActivity: ProviderLoyaltyActivity[];
}

export interface DiscoverySectionItem {
  id: string;
  section_id: string;
  provider_id?: string | null;
  service_id?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  badge?: string | null;
  sort_order: number;
  metadata?: Record<string, any> | null;
  provider?: Provider | null;
  service?: Service | null;
}

export interface DiscoverySection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  layout: string;
  feature_flag?: string | null;
  priority: number;
  items: DiscoverySectionItem[];
}

export interface ProviderSchedulingSettings {
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  allowOverlaps: boolean;
  cancellationPolicyHours: number;
  cancellationPolicyMessage?: string;
  reminderLeadTimeMinutes: number;
}

export interface AppointmentValidationResult {
  ok: boolean;
  reason?: 'provider_offline' | 'employee_offline' | 'conflict';
  message?: string;
  settings: ProviderSchedulingSettings;
  conflictingAppointments?: Appointment[];
}

const DEFAULT_SCHEDULING_SETTINGS: ProviderSchedulingSettings = {
  bufferBeforeMinutes: 10,
  bufferAfterMinutes: 10,
  allowOverlaps: false,
  cancellationPolicyHours: 12,
  cancellationPolicyMessage: '',
  reminderLeadTimeMinutes: 60,
};

export interface ProviderDashboardMetrics {
  revenue: { currency: string; amount: number };
  monthlyAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  noShowRate: number;
  rebookingRate: number;
  repeatClients: number;
  totalClientsServed: number;
  reminderEligibleAppointments: number;
}

export class BookingService {
  private static isFeatureEnabled(flag?: string | null): boolean {
    if (!flag) return true;
    return ACTIVE_FEATURE_FLAGS.includes(flag);
  }

  private static generateInviteToken(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
    const random = Math.random().toString(36).slice(2);
    const timestamp = Date.now().toString(36);
    return `${random}${timestamp}`.slice(0, 32);
  }

  private static computeInviteExpiry(hours: number = INVITE_TOKEN_TTL_HOURS): string {
    const expires = new Date();
    expires.setHours(expires.getHours() + hours);
    return expires.toISOString();
  }

  // 📍 Obtener proveedores por categoría
  static async getProvidersByCategory(category: string): Promise<Provider[]> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching providers by category:', error);
      throw error;
    }
  }

  // 📍 Obtener todos los proveedores activos
  static async getAllProviders(): Promise<Provider[]> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all providers:', error);
      throw error;
    }
  }

  static async getProviderSchedulingSettings(providerId: string): Promise<ProviderSchedulingSettings> {
    try {
      const { data, error } = await supabase
        .from('provider_settings' as any)
        .select('buffer_before_minutes, buffer_after_minutes, allow_overlaps, cancellation_policy_hours, cancellation_policy_message, reminder_lead_time_minutes')
        .eq('provider_id', providerId)
        .single();

      if (error) {
        console.warn('⚠️ [BOOKING SERVICE] Using default scheduling settings:', error.message);
        return DEFAULT_SCHEDULING_SETTINGS;
      }

      if (!data) {
        return DEFAULT_SCHEDULING_SETTINGS;
      }

      return {
        bufferBeforeMinutes:
          typeof data.buffer_before_minutes === 'number'
            ? data.buffer_before_minutes
            : DEFAULT_SCHEDULING_SETTINGS.bufferBeforeMinutes,
        bufferAfterMinutes:
          typeof data.buffer_after_minutes === 'number'
            ? data.buffer_after_minutes
            : DEFAULT_SCHEDULING_SETTINGS.bufferAfterMinutes,
        allowOverlaps: Boolean(data.allow_overlaps),
        cancellationPolicyHours:
          typeof data.cancellation_policy_hours === 'number'
            ? data.cancellation_policy_hours
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyHours,
        cancellationPolicyMessage:
          typeof data.cancellation_policy_message === 'string'
            ? data.cancellation_policy_message
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyMessage,
        reminderLeadTimeMinutes:
          typeof data.reminder_lead_time_minutes === 'number'
            ? data.reminder_lead_time_minutes
            : DEFAULT_SCHEDULING_SETTINGS.reminderLeadTimeMinutes,
      };
    } catch (error) {
      console.warn('⚠️ [BOOKING SERVICE] Fallback scheduling settings due to error:', error);
      return DEFAULT_SCHEDULING_SETTINGS;
    }
  }

  static async upsertProviderSchedulingSettingsByProviderId(
    providerId: string,
    settings: Partial<ProviderSchedulingSettings>
  ): Promise<ProviderSchedulingSettings> {
    try {
      const payload = {
        provider_id: providerId,
        buffer_before_minutes:
          typeof settings.bufferBeforeMinutes === 'number'
            ? settings.bufferBeforeMinutes
            : DEFAULT_SCHEDULING_SETTINGS.bufferBeforeMinutes,
        buffer_after_minutes:
          typeof settings.bufferAfterMinutes === 'number'
            ? settings.bufferAfterMinutes
            : DEFAULT_SCHEDULING_SETTINGS.bufferAfterMinutes,
        allow_overlaps:
          typeof settings.allowOverlaps === 'boolean'
            ? settings.allowOverlaps
            : DEFAULT_SCHEDULING_SETTINGS.allowOverlaps,
        cancellation_policy_hours:
          typeof settings.cancellationPolicyHours === 'number'
            ? settings.cancellationPolicyHours
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyHours,
        cancellation_policy_message:
          typeof settings.cancellationPolicyMessage === 'string'
            ? settings.cancellationPolicyMessage
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyMessage,
        reminder_lead_time_minutes:
          typeof settings.reminderLeadTimeMinutes === 'number'
            ? settings.reminderLeadTimeMinutes
            : DEFAULT_SCHEDULING_SETTINGS.reminderLeadTimeMinutes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('provider_settings' as any)
        .upsert(payload, { onConflict: 'provider_id' })
        .select('buffer_before_minutes, buffer_after_minutes, allow_overlaps, cancellation_policy_hours, cancellation_policy_message, reminder_lead_time_minutes')
        .single();

      if (error) {
        console.error('Error upserting provider scheduling settings:', error);
        throw error;
      }

      const result = data || payload;
      return {
        bufferBeforeMinutes: result.buffer_before_minutes ?? DEFAULT_SCHEDULING_SETTINGS.bufferBeforeMinutes,
        bufferAfterMinutes: result.buffer_after_minutes ?? DEFAULT_SCHEDULING_SETTINGS.bufferAfterMinutes,
        allowOverlaps:
          typeof result.allow_overlaps === 'boolean'
            ? result.allow_overlaps
            : DEFAULT_SCHEDULING_SETTINGS.allowOverlaps,
        cancellationPolicyHours:
          typeof result.cancellation_policy_hours === 'number'
            ? result.cancellation_policy_hours
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyHours,
        cancellationPolicyMessage:
          typeof result.cancellation_policy_message === 'string'
            ? result.cancellation_policy_message
            : DEFAULT_SCHEDULING_SETTINGS.cancellationPolicyMessage,
        reminderLeadTimeMinutes:
          typeof result.reminder_lead_time_minutes === 'number'
            ? result.reminder_lead_time_minutes
            : DEFAULT_SCHEDULING_SETTINGS.reminderLeadTimeMinutes,
      };
    } catch (error: any) {
      if (error?.message?.includes('provider_settings')) {
        throw new Error(
          'No se encontró la tabla provider_settings. Ejecuta la migración de configuración de proveedores en Supabase.'
        );
      }

      console.error('Error saving provider scheduling settings:', error);
      throw error;
    }
  }

  static async saveProviderSchedulingSettings(
    userId: string,
    settings: Partial<ProviderSchedulingSettings>
  ): Promise<ProviderSchedulingSettings> {
    const provider = await this.getProviderById(userId);
    if (!provider) {
      throw new Error('No se encontró el proveedor para el usuario actual.');
    }

    return this.upsertProviderSchedulingSettingsByProviderId(provider.id, settings);
  }

  // 📍 Obtener detalles de un proveedor
  static async getProviderDetails(providerId: string): Promise<Provider | null> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching provider details:', error);
      throw error;
    }
  }

  static async getProviderById(userId: string): Promise<Provider | null> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('Provider not found for user:', userId, error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching provider by user ID:', error);
      return null;
    }
  }

  // 📍 Obtener servicios de un proveedor (solo activos - para clientes)
  static async getProviderServices(providerId: string): Promise<Service[]> {
    try {
      // Check cache first if offline or just for speed
      const cached = await CacheService.get<Service[]>(`services_${providerId}`);
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected && cached) {
        console.log('🔌 [BOOKING SERVICE] Returning cached services (offline)');
        return cached;
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Update cache
      if (data) {
        await CacheService.set(`services_${providerId}`, data);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to cache on error if available
      const cached = await CacheService.get<Service[]>(`services_${providerId}`);
      if (cached) {
        console.log('⚠️ [BOOKING SERVICE] Fetch failed, returning cached services');
        return cached;
      }
      throw error;
    }
  }

  // 📸 Obtener medios destacados del proveedor
  static async getProviderMedia(providerId: string): Promise<ProviderMedia[]> {
    try {
      const { data, error } = await supabase
        .from('provider_media' as any)
        .select('*')
        .eq('provider_id', providerId)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as ProviderMedia[]) || [];
    } catch (error) {
      console.error('Error fetching provider media:', error);
      return [];
    }
  }

  // 👥 Obtener miembros del equipo del proveedor
  static async getProviderTeam(providerId: string): Promise<ProviderTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('provider_team_members' as any)
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as ProviderTeamMember[]) || [];
    } catch (error) {
      console.error('Error fetching provider team:', error);
      return [];
    }
  }

  // ✨ Obtener destacados del proveedor
  static async getProviderHighlights(providerId: string): Promise<ProviderHighlight[]> {
    try {
      const { data, error } = await supabase
        .from('provider_highlights' as any)
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as ProviderHighlight[]) || [];
    } catch (error) {
      console.error('Error fetching provider highlights:', error);
      return [];
    }
  }

  // 👥 Obtener empleados de un proveedor
  static async getProviderEmployees(providerId: string): Promise<Employee[]> {
    try {
      const cached = await CacheService.get<Employee[]>(`employees_${providerId}`);
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected && cached) {
        console.log('🔌 [BOOKING SERVICE] Returning cached employees (offline)');
        return cached;
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profiles:profile_id (
            avatar_url,
            full_name
          )
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true);

      if (error) throw error;

      const employees = (data || []).map(emp => {
        const profileData = Array.isArray(emp.profiles) ? emp.profiles[0] : emp.profiles;
        const avatarUrl = profileData?.avatar_url;

        return {
          ...emp,
          profile_image_url: avatarUrl || emp.profile_image_url
        };
      });

      await CacheService.set(`employees_${providerId}`, employees);
      return employees;
    } catch (error) {
      console.error('Error fetching provider employees:', error);
      const cached = await CacheService.get<Employee[]>(`employees_${providerId}`);
      if (cached) return cached;
      throw error;
    }
  }

  static async getEmployeeProfile(userId?: string): Promise<Employee | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUser = userId || user?.id;
      if (!targetUser) {
        return null;
      }

      console.log('🔍 [BOOKING SERVICE] Buscando perfil de empleado para userId:', targetUser);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('profile_id', targetUser)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error fetching employee profile:', error);
        throw error;
      }

      console.log('🔍 [BOOKING SERVICE] Resultado búsqueda empleado:', data ? 'Encontrado' : 'No encontrado', data?.id);
      return data || null;
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      return null;
    }
  }

  // 👥 Obtener disponibilidad de un empleado
  static async getEmployeeAvailability(employeeId: string, dayOfWeek: number): Promise<{ start_time: string, end_time: string, is_available: boolean }[]> {
    if (employeeId === 'any') {
      return [];
    }
    try {
      const { data, error } = await supabase
        .rpc('get_employee_availability', {
          employee_uuid: employeeId,
          check_day: dayOfWeek
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee availability:', error);
      throw error;
    }
  }

  // 👥 Obtener toda la disponibilidad semanal de un empleado
  static async getEmployeeWeeklyAvailability(employeeId: string): Promise<EmployeeAvailability[]> {
    if (employeeId === 'any') {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('employee_availabilities')
        .select('*')
        .eq('employee_id', employeeId)
        .order('day_of_week, start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee weekly availability:', error);
      throw error;
    }
  }

  // 👥 Actualizar disponibilidad completa de un empleado
  static async updateEmployeeAvailability(
    employeeId: string,
    availability: Record<string, { enabled: boolean; startTime: string; endTime: string }>
  ): Promise<void> {
    try {
      // First, delete all existing availabilities for this employee
      const { error: deleteError } = await supabase
        .from('employee_availabilities')
        .delete()
        .eq('employee_id', employeeId);

      if (deleteError) throw deleteError;

      // Convert weekday keys to day_of_week numbers
      const dayMapping: Record<string, number> = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };

      // Insert new availabilities
      const newAvailabilities = Object.entries(availability)
        .filter(([_, dayData]) => dayData.enabled)
        .map(([dayKey, dayData]) => ({
          employee_id: employeeId,
          day_of_week: dayMapping[dayKey],
          start_time: dayData.startTime,
          end_time: dayData.endTime,
          is_available: true
        }));

      if (newAvailabilities.length > 0) {
        const { error: insertError } = await supabase
          .from('employee_availabilities')
          .insert(newAvailabilities);

        if (insertError) throw insertError;
      }

      console.log('✅ Employee availability updated successfully:', { employeeId, availabilityCount: newAvailabilities.length });
    } catch (error) {
      console.error('Error updating employee availability:', error);
      throw error;
    }
  }

  // 👥 Habilitar/deshabilitar horario personalizado de empleado
  static async updateEmployeeCustomSchedule(employeeId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ custom_schedule_enabled: enabled })
        .eq('id', employeeId);

      if (error) throw error;

      // If disabling custom schedule, also clear all employee availabilities
      if (!enabled) {
        await supabase
          .from('employee_availabilities')
          .delete()
          .eq('employee_id', employeeId);
      }

      console.log('✅ Employee custom schedule updated:', { employeeId, enabled });
    } catch (error) {
      console.error('Error updating employee custom schedule:', error);
      throw error;
    }
  }

  // 👥 Crear un nuevo empleado
  static async createEmployee(employeeData: {
    provider_id: string;
    name: string;
    position?: string;
    bio?: string;
    is_owner?: boolean;
    is_active?: boolean;
    custom_schedule_enabled?: boolean;
    profile_image_url?: string;
    email?: string | null;
    phone?: string | null;
    profile_id?: string | null;
    inviteEmail?: string | null;
    inviteStatus?: 'draft' | 'pending' | 'accepted' | 'revoked';
    inviteToken?: string | null;
    inviteExpiresAt?: string | null;
    role?: string;
  }): Promise<Employee> {
    try {
      const payload: any = {
        provider_id: employeeData.provider_id,
        name: employeeData.name,
        position: employeeData.position || 'Empleado',
        bio: employeeData.bio || '',
        is_owner: employeeData.is_owner || false,
        is_active: employeeData.is_active ?? true,
        custom_schedule_enabled: employeeData.custom_schedule_enabled || false,
        profile_image_url: employeeData.profile_image_url || null,
        email: employeeData.email || employeeData.inviteEmail || null,
        phone: employeeData.phone || null,
        profile_id: employeeData.profile_id || null,
        role: employeeData.role || 'staff',
      };

      if (employeeData.inviteEmail && !employeeData.profile_id) {
        const token = employeeData.inviteToken || BookingService.generateInviteToken();
        payload.invite_email = employeeData.inviteEmail;
        payload.invite_status = employeeData.inviteStatus || 'pending';
        payload.invite_token = token;
        payload.invite_token_expires_at =
          employeeData.inviteExpiresAt || BookingService.computeInviteExpiry();
      } else if (employeeData.profile_id) {
        payload.invite_email = employeeData.email || employeeData.inviteEmail || null;
        payload.invite_status = 'accepted';
        payload.invite_token = null;
        payload.invite_token_expires_at = null;
      }

      const { data, error } = await supabase
        .from('employees')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async inviteEmployee(params: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    bio?: string;
    role?: string;
  }): Promise<{ employee: Employee; inviteToken: string; inviteUrl: string; expiresAt: string }> {
    const {
      name,
      email,
      phone,
      position = 'Empleado',
      bio = '',
      role = 'staff',
    } = params;

    if (!email.includes('@')) {
      throw new Error('Email de invitación inválido');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const provider = await this.getProviderById(user.id);
    if (!provider) {
      throw new Error('No se encontró el proveedor para el usuario actual.');
    }

    // Evitar duplicados por email o teléfono dentro del mismo proveedor
    if (email || phone) {
      const { data: existing, error: existingError } = await supabase
        .from('employees')
        .select('id, email, phone, is_active, invite_status')
        .eq('provider_id', provider.id)
        .eq('is_active', true)
        .or([
          email ? `email.eq.${email.trim().toLowerCase()}` : undefined,
          phone ? `phone.eq.${phone}` : undefined,
        ].filter(Boolean).join(','));

      if (existingError) {
        console.warn('🔴 [BOOKING SERVICE] Error checking duplicate employees:', existingError);
      } else if (existing && existing.length > 0) {
        throw new Error('Ya existe un empleado activo con este email o teléfono.');
      }
    }

    const inviteToken = BookingService.generateInviteToken();
    const expiresAt = BookingService.computeInviteExpiry();

    const employee = await this.createEmployee({
      provider_id: provider.id,
      name: name.trim(),
      position,
      bio,
      phone: phone || null,
      inviteEmail: email.trim().toLowerCase(),
      inviteStatus: 'pending',
      inviteToken,
      inviteExpiresAt: expiresAt,
      role,
      is_owner: false,
      is_active: true,
      custom_schedule_enabled: false,
    });

    const inviteUrl = `${process.env.EXPO_PUBLIC_EMPLOYEE_INVITE_URL ?? 'agendave://accept-invite'}?token=${inviteToken}`;

    // Enviar el email de invitación
    try {
      const { EmailService } = await import('./email-service');
      await EmailService.sendEmployeeInvitation(
        email.trim().toLowerCase(),
        name.trim(),
        provider.business_name || 'AgendaVE',
        inviteUrl
      );
      console.log('✅ [BOOKING SERVICE] Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('⚠️ [BOOKING SERVICE] Failed to send invitation email:', emailError);
      // No lanzar error para que la invitación se cree de todas formas
      // El owner puede compartir manualmente el link
    }

    return { employee, inviteToken, inviteUrl, expiresAt };
  }

  static async resendEmployeeInvite(employeeId: string): Promise<{ inviteToken: string; inviteUrl: string; expiresAt: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, provider_id')
      .eq('id', employeeId)
      .maybeSingle();

    if (error) throw error;
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }

    const provider = await this.getProviderById(user.id);
    if (!provider || provider.id !== employee.provider_id) {
      throw new Error('No tienes permisos para reenviar esta invitación.');
    }

    const inviteToken = BookingService.generateInviteToken();
    const expiresAt = BookingService.computeInviteExpiry();

    const { error: updateError } = await supabase
      .from('employees')
      .update({
        invite_status: 'pending',
        invite_token: inviteToken,
        invite_token_expires_at: expiresAt,
      })
      .eq('id', employeeId);

    if (updateError) throw updateError;

    const inviteUrl = `${process.env.EXPO_PUBLIC_EMPLOYEE_INVITE_URL ?? 'agendave://accept-invite'}?token=${inviteToken}`;

    return { inviteToken, inviteUrl, expiresAt };
  }

  static async deactivateEmployee(employeeId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const provider = await this.getProviderById(user.id);
    if (!provider) {
      throw new Error('No tienes permisos para eliminar este empleado.');
    }

    const { error } = await supabase
      .from('employees')
      .update({
        is_active: false,
        invite_status: 'revoked',
        invite_token: null,
        invite_token_expires_at: null,
      })
      .eq('id', employeeId)
      .eq('provider_id', provider.id);

    if (error) {
      console.error('🔴 [BOOKING SERVICE] Error deactivating employee:', error);
      throw error;
    }
  }




  static async acceptEmployeeInvite(token: string): Promise<Employee> {
    const cleanedToken = token.trim();
    if (!cleanedToken) {
      throw new Error('Token de invitación inválido');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Debes iniciar sesión para aceptar la invitación.');
    }

    console.log('🔴 [BOOKING SERVICE] Accepting invite for token:', cleanedToken, 'user:', user.id);

    console.log('🔴 [BOOKING SERVICE] Accepting invite via RPC for token:', cleanedToken);

    const { data: updatedEmployee, error: rpcError } = await supabase.rpc('accept_employee_invite', {
      token_input: cleanedToken
    });

    if (rpcError) {
      console.error('🔴 [BOOKING SERVICE] Error accepting invite via RPC:', rpcError);
      throw new Error(rpcError.message || 'Error al aceptar la invitación');
    }

    if (!updatedEmployee) {
      throw new Error('No se pudo procesar la invitación.');
    }

    // Cast the result to Employee type since RPC returns JSON
    return updatedEmployee as Employee;
  }

  static async notifyEmployeeAssignment(employeeId: string, payload: {
    appointmentId: string;
    providerName: string;
    appointmentDate: string;
    appointmentTime?: string;
    serviceName?: string;
    clientName?: string;
    status?: 'created' | 'updated' | 'cancelled' | 'confirmed';
  }): Promise<void> {
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('profile_id, name')
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      if (!employee?.profile_id) {
        return;
      }

      if (payload.status === 'cancelled') {
        await NotificationService.notifyAppointmentCancellation(
          employee.profile_id,
          {
            id: payload.appointmentId,
            provider_name: payload.providerName,
            client_name: payload.clientName || 'Cliente',
          },
          false
        );
        return;
      }

      if (payload.status === 'confirmed') {
        await NotificationService.notifyAppointmentConfirmation(employee.profile_id, {
          id: payload.appointmentId,
          provider_name: payload.providerName,
          appointment_date: payload.appointmentDate,
          appointment_time: payload.appointmentTime,
        });
        return;
      }

      if (payload.status === 'updated') {
        await NotificationService.notifyEmployeeAppointmentUpdate(employee.profile_id, {
          id: payload.appointmentId,
          provider_name: payload.providerName,
          appointment_date: payload.appointmentDate,
          appointment_time: payload.appointmentTime,
          service_name: payload.serviceName,
          client_name: payload.clientName,
        });
        return;
      }

      await NotificationService.notifyEmployeeNewAppointment(
        employee.profile_id,
        {
          id: payload.appointmentId,
          provider_name: payload.providerName,
          appointment_date: payload.appointmentDate,
          appointment_time: payload.appointmentTime,
          service_name: payload.serviceName,
          client_name: payload.clientName,
        }
      );
    } catch (error) {
      console.error('Error notifying employee assignment:', error);
    }
  }

  // 📍 Obtener TODOS los servicios de un proveedor (activos e inactivos - para gestión)
  static async getAllProviderServices(providerId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('is_active', { ascending: false }) // Activos primero
        .order('name'); // Luego por nombre

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all provider services:', error);
      throw error;
    }
  }

  // 📋 Obtener disponibilidad de un proveedor
  static async getProviderAvailability(providerId: string): Promise<Availability[]> {
    try {
      // Try with is_active filter first
      let { data, error } = await supabase
        .from('availabilities')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('weekday, start_time');

      // If is_active column doesn't exist, try without it
      if (error && error.message?.includes('is_active')) {
        console.log('🔴 [BOOKING SERVICE] Retrying availability query without is_active...');
        const result = await supabase
          .from('availabilities')
          .select('*')
          .eq('provider_id', providerId)
          .order('weekday, start_time');

        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider availability:', error);
      throw error;
    }
  }

  // 📋 Obtener disponibilidad de un proveedor con limpieza de datos
  static async getProviderAvailabilityWithCleanup(userId: string): Promise<Availability[]> {
    try {
      // First, run consistency check
      await this.checkAvailabilityConsistency(userId);

      // Get the provider
      const provider = await this.getProviderById(userId);
      if (!provider) {
        return [];
      }

      // Now get clean availability data
      return await this.getProviderAvailability(provider.id);
    } catch (error) {
      console.error('Error fetching provider availability with cleanup:', error);
      throw error;
    }
  }

  // 📍 Obtener horarios disponibles para una fecha específica
  static async getAvailableSlots(providerId: string, date: string, serviceId?: string): Promise<string[]> {
    try {
      const settings = await this.getProviderSchedulingSettings(providerId);

      let serviceDuration = 30;
      if (serviceId) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single();
        serviceDuration = serviceData?.duration_minutes || 30;
      }

      const availability = await this.getProviderAvailability(providerId);
      const dayOfWeek = new Date(date).getDay();
      const dayAvailability = availability.find((a) => a.weekday === dayOfWeek);
      if (!dayAvailability) {
        return [];
      }

      const dayStartMinutes = this.timeStringToMinutes(dayAvailability.start_time);
      const dayEndMinutes = this.timeStringToMinutes(dayAvailability.end_time);

      let appointmentsError;
      let existingAppointments: any[] = [];
      const appointmentsQuery = await supabase
        .from('appointments')
        .select('id, appointment_time, service_id, employee_id, start_ts, end_ts, services(duration_minutes)')
        .eq('provider_id', providerId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      appointmentsError = appointmentsQuery.error;
      existingAppointments = appointmentsQuery.data || [];

      if (appointmentsError && appointmentsError.message?.includes('start_ts')) {
        const fallback = await supabase
          .from('appointments')
          .select('id, appointment_time, service_id, employee_id, services(duration_minutes)')
          .eq('provider_id', providerId)
          .eq('appointment_date', date)
          .in('status', ['pending', 'confirmed']);
        appointmentsError = fallback.error;
        existingAppointments = fallback.data || [];
      }

      if (appointmentsError) throw appointmentsError;

      const providerServices = await this.getProviderServices(providerId);
      const serviceMap = new Map(providerServices.map((svc) => [svc.id, svc]));

      const availableSlots: string[] = [];
      let currentMinute = dayStartMinutes;

      // 🧠 Smart Interval Logic:
      // - If service is short (< 15 mins), use exact duration (e.g. 10, 12 mins).
      // - If service is a multiple of 30 mins (30, 60, 90), use 30 min intervals for a cleaner grid.
      // - Otherwise (e.g. 45 mins), use 15 min intervals to maximize flexibility.
      let slotIncrement = 15;
      if (serviceDuration < 15) {
        slotIncrement = serviceDuration;
      } else if (serviceDuration % 30 === 0) {
        slotIncrement = 30;
      } else {
        slotIncrement = 15;
      }

      while (currentMinute + serviceDuration <= dayEndMinutes) {
        const slotStart = currentMinute;
        const slotEnd = slotStart + serviceDuration;
        const slotStartWithBuffer = slotStart - settings.bufferBeforeMinutes;
        const slotEndWithBuffer = slotEnd + settings.bufferAfterMinutes;

        if (slotStartWithBuffer < dayStartMinutes || slotEndWithBuffer > dayEndMinutes) {
          currentMinute += slotIncrement;
          continue;
        }

        const hasConflict = existingAppointments?.some((apt) => {
          if (settings.allowOverlaps) {
            return false;
          }

          let aptStart = this.timeStringToMinutes(apt.appointment_time);
          let aptDuration = serviceDuration;

          // Prioritize actual start/end timestamps if available (most accurate)
          if (apt.start_ts && apt.end_ts) {
            const start = new Date(apt.start_ts);
            const end = new Date(apt.end_ts);
            aptDuration = (end.getTime() - start.getTime()) / 60000;
          } else {
            // Fallback to service duration lookup
            const service = serviceMap.get(apt.service_id);
            aptDuration = service?.duration_minutes || (Array.isArray(apt.services) ? apt.services[0]?.duration_minutes : (apt as any)?.services?.duration_minutes) || serviceDuration;
          }

          const aptEnd = aptStart + aptDuration;
          const aptStartWithBuffer = aptStart - settings.bufferBeforeMinutes;
          const aptEndWithBuffer = aptEnd + settings.bufferAfterMinutes;

          return this.rangesOverlap(slotStartWithBuffer, slotEndWithBuffer, aptStartWithBuffer, aptEndWithBuffer);
        });

        if (!hasConflict) {
          availableSlots.push(this.minutesToTimeLabel(slotStart));
        }

        currentMinute += slotIncrement;
      }

      return availableSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  // 👥 Obtener horarios disponibles para un empleado específico
  static async getEmployeeAvailableSlots(employeeId: string, providerId: string, date: string, serviceId?: string): Promise<string[]> {
    if (employeeId === 'any') {
      return this.getAvailableSlots(providerId, date, serviceId);
    }
    try {
      console.log('🔴 [GET EMPLOYEE SLOTS] Getting available slots for employee:', { employeeId, providerId, date, serviceId });
      const settings = await this.getProviderSchedulingSettings(providerId);

      let serviceDuration = 30;
      if (serviceId) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single();
        serviceDuration = serviceData?.duration_minutes || 30;
      }

      const dayOfWeek = new Date(date).getDay();
      const employeeAvailability = await this.getEmployeeAvailability(employeeId, dayOfWeek);

      if (!employeeAvailability || employeeAvailability.length === 0) {
        return [];
      }

      const activeWindow = employeeAvailability.find((slot) => slot.is_available);
      if (!activeWindow) {
        return [];
      }

      const dayStartMinutes = this.timeStringToMinutes(activeWindow.start_time);
      const dayEndMinutes = this.timeStringToMinutes(activeWindow.end_time);

      let appointmentsError;
      let existingAppointments: any[] = [];
      const appointmentsQuery = await supabase
        .from('appointments')
        .select('id, appointment_time, service_id, start_ts, end_ts, services(duration_minutes)')
        .eq('provider_id', providerId)
        .eq('employee_id', employeeId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      appointmentsError = appointmentsQuery.error;
      existingAppointments = appointmentsQuery.data || [];

      if (appointmentsError && appointmentsError.message?.includes('start_ts')) {
        const fallback = await supabase
          .from('appointments')
          .select('id, appointment_time, service_id, services(duration_minutes)')
          .eq('provider_id', providerId)
          .eq('employee_id', employeeId)
          .eq('appointment_date', date)
          .in('status', ['pending', 'confirmed']);
        appointmentsError = fallback.error;
        existingAppointments = fallback.data || [];
      }

      if (appointmentsError) throw appointmentsError;

      const providerServices = await this.getProviderServices(providerId);
      const serviceMap = new Map(providerServices.map((svc) => [svc.id, svc]));

      const availableSlots: string[] = [];
      let currentMinute = dayStartMinutes;

      // 🧠 Smart Interval Logic:
      // - If service is short (< 15 mins), use exact duration (e.g. 10, 12 mins).
      // - If service is a multiple of 30 mins (30, 60, 90), use 30 min intervals for a cleaner grid.
      // - Otherwise (e.g. 45 mins), use 15 min intervals to maximize flexibility.
      let slotIncrement = 15;
      if (serviceDuration < 15) {
        slotIncrement = serviceDuration;
      } else if (serviceDuration % 30 === 0) {
        slotIncrement = 30;
      } else {
        slotIncrement = 15;
      }

      while (currentMinute + serviceDuration <= dayEndMinutes) {
        const slotStart = currentMinute;
        const slotEnd = slotStart + serviceDuration;
        const slotStartWithBuffer = slotStart - settings.bufferBeforeMinutes;
        const slotEndWithBuffer = slotEnd + settings.bufferAfterMinutes;

        if (slotStartWithBuffer < dayStartMinutes || slotEndWithBuffer > dayEndMinutes) {
          currentMinute += slotIncrement;
          continue;
        }

        const hasConflict = existingAppointments?.some((apt) => {
          if (settings.allowOverlaps) {
            return false;
          }

          let aptStart = this.timeStringToMinutes(apt.appointment_time);
          let aptDuration = serviceDuration;

          // Prioritize actual start/end timestamps if available (most accurate)
          if (apt.start_ts && apt.end_ts) {
            const start = new Date(apt.start_ts);
            const end = new Date(apt.end_ts);
            aptDuration = (end.getTime() - start.getTime()) / 60000;
          } else {
            // Fallback to service duration lookup
            const service = serviceMap.get(apt.service_id);
            aptDuration = service?.duration_minutes || (Array.isArray(apt.services) ? apt.services[0]?.duration_minutes : (apt as any)?.services?.duration_minutes) || serviceDuration;
          }

          const aptEnd = aptStart + aptDuration;
          const aptStartWithBuffer = aptStart - settings.bufferBeforeMinutes;
          const aptEndWithBuffer = aptEnd + settings.bufferAfterMinutes;

          return this.rangesOverlap(slotStartWithBuffer, slotEndWithBuffer, aptStartWithBuffer, aptEndWithBuffer);
        });

        if (!hasConflict) {
          availableSlots.push(this.minutesToTimeLabel(slotStart));
        }

        currentMinute += slotIncrement;
      }

      return availableSlots;
    } catch (error) {
      console.error('Error fetching employee available slots:', error);
      throw error;
    }
  }

  // 📍 Crear una nueva cita
  static async validateAppointmentSlot(params: {
    providerId: string;
    serviceId: string;
    appointmentDate: string;
    appointmentTime: string;
    employeeId?: string;
    ignoreAppointmentId?: string;
  }): Promise<AppointmentValidationResult> {
    const {
      providerId,
      serviceId,
      appointmentDate,
      appointmentTime,
      employeeId,
      ignoreAppointmentId,
    } = params;

    // Treat 'any' as undefined (no specific employee constraint)
    const effectiveEmployeeId = employeeId === 'any' ? undefined : employeeId;

    const settings = await this.getProviderSchedulingSettings(providerId);

    const { data: serviceData } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();

    const serviceDuration = serviceData?.duration_minutes || 30;

    const requestStartMinutes = this.timeStringToMinutes(appointmentTime);
    const requestEndMinutes = requestStartMinutes + serviceDuration;

    const availability = await this.getProviderAvailability(providerId);
    const dayOfWeek = new Date(appointmentDate).getDay();
    const dayAvailability = availability.find((slot) => slot.weekday === dayOfWeek);

    if (!dayAvailability) {
      return {
        ok: false,
        reason: 'provider_offline',
        message: 'El proveedor no atiende en este día.',
        settings,
      };
    }

    const providerStartMinutes = this.timeStringToMinutes(dayAvailability.start_time);
    const providerEndMinutes = this.timeStringToMinutes(dayAvailability.end_time);

    if (requestStartMinutes < providerStartMinutes || requestEndMinutes > providerEndMinutes) {
      return {
        ok: false,
        reason: 'provider_offline',
        message: 'El proveedor no está disponible a esta hora.',
        settings,
      };
    }

    if (
      requestStartMinutes - settings.bufferBeforeMinutes < providerStartMinutes ||
      requestEndMinutes + settings.bufferAfterMinutes > providerEndMinutes
    ) {
      return {
        ok: false,
        reason: 'provider_offline',
        message: 'Este horario está demasiado cerca del inicio o cierre del local.',
        settings,
      };
    }

    if (effectiveEmployeeId) {
      const dayAvailabilityForEmployee = await this.getEmployeeAvailability(effectiveEmployeeId, dayOfWeek);
      const hasSlot = dayAvailabilityForEmployee.some((slot) => {
        if (!slot?.is_available) return false;
        const slotStart = this.timeStringToMinutes(slot.start_time);
        const slotEnd = this.timeStringToMinutes(slot.end_time);
        return requestStartMinutes >= slotStart && requestEndMinutes <= slotEnd;
      });

      if (!hasSlot) {
        return {
          ok: false,
          reason: 'employee_offline',
          message: 'El profesional elegido no está disponible a esta hora.',
          settings,
        };
      }
    }

    const { data: existingAppointmentsRaw, error: existingAppointmentsError } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, service_id, employee_id, start_ts, end_ts, services(duration_minutes)')
      .eq('provider_id', providerId)
      .eq('appointment_date', appointmentDate)
      .in('status', ['pending', 'confirmed']);

    if (existingAppointmentsError) {
      console.warn('⚠️ [BOOKING SERVICE] Could not load appointments for validation:', existingAppointmentsError);
    }

    const existingAppointments = (existingAppointmentsRaw || []) as any[];

    const providerServices = await this.getProviderServices(providerId);
    const serviceMap = new Map(providerServices.map((svc) => [svc.id, svc]));

    const conflicts = existingAppointments.filter((apt) => {
      if (ignoreAppointmentId && apt.id === ignoreAppointmentId) {
        return false;
      }

      if (effectiveEmployeeId) {
        const sameEmployee = apt.employee_id && apt.employee_id === effectiveEmployeeId;
        if (!sameEmployee) {
          return false;
        }
      }

      if (settings.allowOverlaps) {
        return false;
      }

      let aptStart = this.timeStringToMinutes(apt.appointment_time);
      let aptDuration = serviceDuration;

      // Prioritize actual start/end timestamps if available (most accurate)
      if (apt.start_ts && apt.end_ts) {
        const start = new Date(apt.start_ts);
        const end = new Date(apt.end_ts);
        aptDuration = (end.getTime() - start.getTime()) / 60000;
      } else {
        // Fallback to service duration lookup
        const service = serviceMap.get(apt.service_id);
        aptDuration = service?.duration_minutes || (Array.isArray(apt.services) ? apt.services[0]?.duration_minutes : (apt as any)?.services?.duration_minutes) || serviceDuration;
      }

      const aptEnd = aptStart + aptDuration;
      const aptStartWithBuffer = aptStart - settings.bufferBeforeMinutes;
      const aptEndWithBuffer = aptEnd + settings.bufferAfterMinutes;

      const slotStartWithBuffer = requestStartMinutes - settings.bufferBeforeMinutes;
      const slotEndWithBuffer = requestEndMinutes + settings.bufferAfterMinutes;

      return this.rangesOverlap(slotStartWithBuffer, slotEndWithBuffer, aptStartWithBuffer, aptEndWithBuffer);
    });

    if (conflicts.length > 0) {
      const conflicting = conflicts[0];
      const startLabel = this.minutesToTimeLabel(this.timeStringToMinutes(conflicting.appointment_time));
      const service = serviceMap.get(conflicting.service_id);
      const duration = service?.duration_minutes || serviceDuration;
      const endLabel = this.minutesToTimeLabel(this.timeStringToMinutes(conflicting.appointment_time) + duration);

      return {
        ok: false,
        reason: 'conflict',
        message: `Este horario se solapa con otra cita programada (${startLabel} - ${endLabel}).`,
        conflictingAppointments: conflicts,
        settings,
      };
    }

    return {
      ok: true,
      settings,
    };
  }

  // 📍 Crear una nueva cita
  static async createAppointment(
    providerId: string,
    serviceId: string,
    appointmentDate: string,
    appointmentTime: string,
    employeeId?: string,
    notes?: string
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const validation = await this.validateAppointmentSlot({
        providerId,
        serviceId,
        appointmentDate,
        appointmentTime,
        employeeId,
      });

      if (!validation.ok) {
        throw new Error(validation.message || 'Este horario ya no está disponible.');
      }

      // Crear timestamp combinando fecha y hora
      const startTimestamp = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

      // Obtener duración del servicio para calcular end_ts
      const { data: serviceData } = await supabase
        .from('services')
        .select('duration_minutes, name')
        .eq('id', serviceId)
        .single();

      const durationMinutes = serviceData?.duration_minutes || 30;
      const endTimestamp = new Date(new Date(startTimestamp).getTime() + durationMinutes * 60000).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          provider_id: providerId,
          service_id: serviceId,
          employee_id: employeeId || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          start_ts: startTimestamp,
          end_ts: endTimestamp,
          status: 'pending',
          notes: notes || null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Load additional metadata for notifications
      try {
        const [{ data: providerDetails }, { data: clientProfile }] = await Promise.all([
          supabase
            .from('providers')
            .select('business_name, user_id')
            .eq('id', providerId)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('display_name, full_name')
            .eq('id', user.id)
            .maybeSingle(),
        ]);

        const providerUserId = providerDetails?.user_id as string | undefined;
        const providerName = providerDetails?.business_name || 'Tu negocio';
        const clientName =
          clientProfile?.display_name ||
          clientProfile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Cliente';

        if (providerUserId) {
          console.log('🔔 [BOOKING SERVICE] Sending notification to provider:', {
            providerUserId,
            providerName,
            clientName,
            serviceName: serviceData?.name,
          });
          await NotificationService.notifyNewAppointment(providerUserId, {
            id: data.id,
            provider_id: providerId,
            provider_name: providerName,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            client_name: clientName,
            service_name: serviceData?.name,
          });
          console.log('✅ [BOOKING SERVICE] Provider notification sent successfully');
        } else {
          console.warn('⚠️ [BOOKING SERVICE] Provider user ID not found, cannot send notification');
        }

        if (employeeId) {
          await this.notifyEmployeeAssignment(employeeId, {
            appointmentId: data.id,
            providerName,
            appointmentDate,
            appointmentTime,
            serviceName: serviceData?.name,
            clientName,
            status: 'created',
          });
        }
      } catch (notificationError) {
        console.warn('⚠️ [BOOKING SERVICE] Error sending notifications for new appointment:', notificationError);
      }

      // ... (notifications logic)

      // Schedule local reminders for the user who created the appointment
      await this.scheduleAppointmentReminders(data);

      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  static async scheduleAppointmentReminders(appointment: Appointment): Promise<void> {
    try {
      const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const now = new Date();

      console.log('🔔 [REMINDERS] Scheduling for:', {
        id: appointment.id,
        dateStr: `${appointment.appointment_date}T${appointment.appointment_time}`,
        parsedDate: appointmentDate.toISOString(),
        now: now.toISOString()
      });

      // 24 hours before
      const reminder24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        console.log('🔔 [REMINDERS] Scheduling 24h reminder at:', reminder24h.toISOString());
        await NotificationService.scheduleLocalNotification({
          title: 'Recordatorio de Cita 📅',
          body: `Mañana tienes una cita a las ${appointment.appointment_time}`,
          data: { appointmentId: appointment.id },
          trigger: { type: 'date', date: reminder24h }
        });
      } else {
        console.log('🔔 [REMINDERS] 24h reminder skipped (past time)');
      }

      // 1 hour before
      const reminder1h = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      if (reminder1h > now) {
        console.log('🔔 [REMINDERS] Scheduling 1h reminder at:', reminder1h.toISOString());
        await NotificationService.scheduleLocalNotification({
          title: 'Tu cita es en 1 hora ⏰',
          body: `Prepárate para tu cita a las ${appointment.appointment_time}`,
          data: { appointmentId: appointment.id },
          trigger: { type: 'date', date: reminder1h }
        });
      } else {
        console.log('🔔 [REMINDERS] 1h reminder skipped (past time)');
      }
    } catch (error) {
      console.warn('⚠️ [BOOKING SERVICE] Error scheduling local reminders:', error);
    }
  }

  // 📍 Obtener citas del cliente
  static async getClientAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // First, get appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (!appointments || appointments.length === 0) {
        return [];
      }

      // Get unique service and provider IDs
      const serviceIds = [...new Set(appointments.map(apt => apt.service_id).filter(Boolean))];
      const providerIds = [...new Set(appointments.map(apt => apt.provider_id).filter(Boolean))];

      // Fetch services and providers separately
      const [servicesData, providersData] = await Promise.all([
        serviceIds.length > 0
          ? supabase.from('services').select('*').in('id', serviceIds)
          : { data: [], error: null },
        providerIds.length > 0
          ? supabase.from('providers').select('*').in('id', providerIds)
          : { data: [], error: null }
      ]);

      const services = servicesData.data || [];
      const providers = providersData.data || [];

      // Manually join the data
      console.log('🔴 [CLIENT APPOINTMENTS] Manual join:', {
        appointmentsCount: appointments.length,
        servicesCount: services.length,
        providersCount: providers.length
      });

      const enrichedAppointments = appointments.map(appointment => ({
        ...appointment,
        services: services.find(s => s.id === appointment.service_id) || null,
        providers: providers.find(p => p.id === appointment.provider_id) || null
      }));

      console.log('🔴 [CLIENT APPOINTMENTS] Sample enriched appointment:', enrichedAppointments[0]);
      return enrichedAppointments;
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      throw error;
    }
  }

  // 📍 Obtener citas del proveedor
  static async getProviderAppointments(userId?: string): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener el proveedor primero
      const provider = await this.getProviderById(userId || user.id);
      if (!provider) {
        console.warn('No provider found for user:', userId || user.id);
        return [];
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(*),
          profiles!appointments_client_id_fkey(id, display_name, phone)
        `)
        .eq('provider_id', provider.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      throw error;
    }
  }

  // 📍 Obtener citas por ID de proveedor (útil para empleados)
  static async getAppointmentsByProviderId(providerId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(*),
          profiles!appointments_client_id_fkey(id, display_name, phone)
        `)
        .eq('provider_id', providerId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointments by provider ID:', error);
      throw error;
    }
  }

  static async getEmployeeAppointments(userId?: string): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const employee = await this.getEmployeeProfile(userId || user.id);
      if (!employee) {
        return [];
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(*),
          profiles!appointments_client_id_fkey(id, display_name, phone)
        `)
        .eq('employee_id', employee.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee appointments:', error);
      return [];
    }
  }

  static async getDiscoverySections(): Promise<DiscoverySection[]> {
    try {
      const { data, error } = await supabase
        .from('discovery_sections' as any)
        .select(`
          id,
          slug,
          title,
          subtitle,
          layout,
          feature_flag,
          priority,
          discovery_section_items (
            id,
            section_id,
            provider_id,
            service_id,
            headline,
            subheadline,
            badge,
            sort_order,
            is_active,
            metadata,
            providers (
              id,
              user_id,
              name,
              business_name,
              bio,
              address,
              phone,
              email,
              logo_url,
              lat,
              lng,
              timezone,
              category,
              rating,
              total_reviews,
              is_active,
              created_at,
              updated_at,
              tagline,
              mission,
              hero_image_url,
              cover_video_url,
              specialties,
              loyalty_enabled
            ),
            services (
              id,
              provider_id,
              name,
              description,
              price_amount,
              price_currency,
              duration_minutes,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        throw error;
      }

      const sections = ((data as any[]) || []).filter((section) =>
        BookingService.isFeatureEnabled(section.feature_flag)
      );

      return sections.map((section) => ({
        id: section.id,
        slug: section.slug,
        title: section.title,
        subtitle: section.subtitle,
        layout: section.layout,
        feature_flag: section.feature_flag,
        priority: section.priority,
        items:
          (section.discovery_section_items || [])
            .filter((item: any) => item?.is_active !== false)
            .sort((a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
            .map((item: any) => ({
              id: item.id,
              section_id: item.section_id,
              provider_id: item.provider_id,
              service_id: item.service_id,
              headline: item.headline,
              subheadline: item.subheadline,
              badge: item.badge,
              sort_order: item.sort_order ?? 0,
              metadata: item.metadata || null,
              provider: item.providers || null,
              service: item.services || null,
            })) as DiscoverySectionItem[],
      })) as DiscoverySection[];
    } catch (error) {
      console.error('Error fetching discovery sections:', error);
      return [];
    }
  }

  // 💹 Obtener ingresos del proveedor para el mes actual (sumatoria de servicios de citas completadas)
  static async getProviderRevenueThisMonth(userId?: string): Promise<{ currency: string; amount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const provider = await this.getProviderById(userId || user.id);
      if (!provider) {
        return { currency: 'USD', amount: 0 };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Obtener citas completadas de este mes con el servicio asociado
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`appointment_date, status, services(price_amount, price_currency)`)
        .eq('provider_id', provider.id)
        .gte('appointment_date', startOfMonth)
        .lte('appointment_date', endOfMonth)
        .eq('status', 'done');

      if (error) throw error;

      let total = 0;
      let currency = 'USD';
      (appointments || []).forEach((apt: any) => {
        const price = apt?.services?.price_amount || 0;
        total += price;
        currency = apt?.services?.price_currency || currency;
      });

      return { currency, amount: total };
    } catch (e) {
      console.error('Error calculating provider revenue:', e);
      return { currency: 'USD', amount: 0 };
    }
  }

  // 🗓️ Obtener conteo de citas del mes actual (todas excepto canceladas)
  static async getMonthlyAppointmentsCount(userId?: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const provider = await this.getProviderById(userId || user.id);
      if (!provider) {
        return 0;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error, count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', provider.id)
        .gte('appointment_date', startOfMonth)
        .lte('appointment_date', endOfMonth)
        .in('status', ['pending', 'confirmed', 'done']);

      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.error('Error getting monthly appointments count:', e);
      return 0;
    }
  }

  static async getProviderLoyaltySummary(providerId: string, userId?: string): Promise<ProviderLoyaltySummary | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        return null;
      }

      const { data: balanceRow, error: balanceError } = await supabase
        .from('provider_loyalty_balances' as any)
        .select('*')
        .eq('provider_id', providerId)
        .eq('client_id', targetUserId)
        .maybeSingle();

      if (balanceError) {
        console.error('Error fetching loyalty balance:', balanceError);
      }

      const { data: activityRows, error: activityError } = await supabase
        .from('provider_loyalty_activity' as any)
        .select('id, provider_id, client_id, points_change, reason, source, created_at')
        .eq('provider_id', providerId)
        .eq('client_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) {
        console.error('Error fetching loyalty activity:', activityError);
      }

      const balance = balanceRow ?? null;
      const pointsBalance = balance?.points_balance ?? 0;
      const totalEarned = balance?.total_earned ?? 0;
      const totalRedeemed = balance?.total_redeemed ?? 0;
      const tier = balance?.tier ?? 'Bronce';

      const remainder = pointsBalance % LOYALTY_REWARD_STEP;
      const pointsToNextReward =
        remainder === 0 ? LOYALTY_REWARD_STEP : LOYALTY_REWARD_STEP - remainder;
      const nextRewardAt = pointsBalance + pointsToNextReward;

      return {
        pointsBalance,
        tier,
        totalEarned,
        totalRedeemed,
        nextRewardAt,
        pointsToNextReward,
        recentActivity: (activityRows as ProviderLoyaltyActivity[]) || [],
      };
    } catch (error) {
      console.error('Error fetching loyalty summary:', error);
      return null;
    }
  }

  static async getProviderDashboardMetrics(userId?: string): Promise<ProviderDashboardMetrics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const provider = await this.getProviderById(userId || user.id);
      if (!provider) {
        return {
          revenue: { currency: 'USD', amount: 0 },
          monthlyAppointments: 0,
          upcomingAppointments: 0,
          pendingAppointments: 0,
          confirmedAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowAppointments: 0,
          noShowRate: 0,
          rebookingRate: 0,
          repeatClients: 0,
          totalClientsServed: 0,
          reminderEligibleAppointments: 0,
        };
      }

      const now = new Date();
      const lookbackStart = new Date(now);
      lookbackStart.setDate(lookbackStart.getDate() - 90);
      const lookbackIso = lookbackStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('id, status, appointment_date, appointment_time, client_id')
        .eq('provider_id', provider.id)
        .gte('appointment_date', lookbackIso);

      if (error) {
        throw error;
      }

      const appointments = data || [];
      const nowMs = now.getTime();

      const parseDateTime = (apt: any): Date | null => {
        if (!apt?.appointment_date) return null;
        const time = typeof apt.appointment_time === 'string' && apt.appointment_time.length > 0
          ? apt.appointment_time
          : '00:00';
        const candidate = new Date(`${apt.appointment_date}T${time}`);
        if (Number.isNaN(candidate.getTime())) {
          return null;
        }
        return candidate;
      };

      const pendingAppointments = appointments.filter((apt) => apt.status === 'pending').length;
      const confirmedAppointments = appointments.filter((apt) => apt.status === 'confirmed').length;
      const completedAppointments = appointments.filter((apt) => apt.status === 'done').length;
      const cancelledAppointments = appointments.filter((apt) => apt.status === 'cancelled').length;
      const noShowAppointments = appointments.filter((apt) => apt.status === 'no_show').length;

      const upcomingAppointments = appointments.filter((apt) => {
        if (!(apt.status === 'pending' || apt.status === 'confirmed')) {
          return false;
        }
        const appointmentDate = parseDateTime(apt);
        if (!appointmentDate) return false;
        return appointmentDate.getTime() >= nowMs;
      }).length;

      const reminderEligibleAppointments = appointments.filter((apt) => {
        if (apt.status !== 'confirmed') return false;
        const appointmentDate = parseDateTime(apt);
        if (!appointmentDate) return false;
        const diffMinutes = (appointmentDate.getTime() - nowMs) / 60000;
        return diffMinutes > 0 && diffMinutes <= 24 * 60;
      }).length;

      const completedForRebooking = appointments.filter((apt) => apt.status === 'done');
      const clientVisitCounts = new Map<string, number>();
      completedForRebooking.forEach((apt) => {
        if (!apt.client_id) return;
        const current = clientVisitCounts.get(apt.client_id) || 0;
        clientVisitCounts.set(apt.client_id, current + 1);
      });

      const totalClientsServed = clientVisitCounts.size;
      const repeatClients = Array.from(clientVisitCounts.values()).filter((count) => count > 1).length;
      const rebookingRate = totalClientsServed > 0
        ? Number(((repeatClients / totalClientsServed) * 100).toFixed(1))
        : 0;

      const attendanceDenominator = completedAppointments + noShowAppointments;
      const noShowRate = attendanceDenominator > 0
        ? Number(((noShowAppointments / attendanceDenominator) * 100).toFixed(1))
        : 0;

      const revenue = await this.getProviderRevenueThisMonth(userId || user.id);
      const monthlyAppointments = await this.getMonthlyAppointmentsCount(userId || user.id);

      return {
        revenue,
        monthlyAppointments,
        upcomingAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        noShowRate,
        rebookingRate,
        repeatClients,
        totalClientsServed,
        reminderEligibleAppointments,
      };
    } catch (error) {
      console.error('Error getting provider dashboard metrics:', error);
      return {
        revenue: { currency: 'USD', amount: 0 },
        monthlyAppointments: 0,
        upcomingAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        noShowRate: 0,
        rebookingRate: 0,
        repeatClients: 0,
        totalClientsServed: 0,
        reminderEligibleAppointments: 0,
      };
    }
  }

  // 📍 Actualizar estado de cita (confirmar/rechazar)
  static async updateAppointmentStatus(
    appointmentId: string,
    status: 'pending' | 'confirmed' | 'cancelled' | 'done' | 'no_show'
  ): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (error) throw error;

      // Enviar notificaciones según el estado
      try {
        const [
          { data: providerData, error: providerError },
          { data: clientProfile, error: clientError },
          { data: serviceInfo, error: serviceError },
        ] = await Promise.all([
          supabase
            .from('providers')
            .select('business_name, user_id')
            .eq('id', data.provider_id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('display_name, full_name')
            .eq('id', data.client_id)
            .maybeSingle(),
          supabase
            .from('services')
            .select('name')
            .eq('id', data.service_id)
            .maybeSingle(),
        ]);

        if (providerError) {
          console.warn('⚠️ [BOOKING SERVICE] Could not load provider for notifications:', providerError);
        }
        if (clientError) {
          console.warn('⚠️ [BOOKING SERVICE] Could not load client profile for notifications:', clientError);
        }
        if (serviceError) {
          console.warn('⚠️ [BOOKING SERVICE] Could not load service for notifications:', serviceError);
        }

        const providerName = providerData?.business_name || 'tu proveedor';
        const providerUserId = providerData?.user_id as string | undefined;
        const clientName =
          (clientProfile as any)?.display_name ||
          (clientProfile as any)?.full_name ||
          'Cliente';
        const serviceName = serviceInfo?.name;

        if (status === 'confirmed') {
          await NotificationService.notifyAppointmentConfirmation(
            data.client_id,
            {
              id: data.id,
              provider_name: providerName,
              appointment_date: data.appointment_date,
              appointment_time: data.appointment_time,
            }
          );

          if (data.employee_id) {
            await this.notifyEmployeeAssignment(data.employee_id, {
              appointmentId: data.id,
              providerName,
              appointmentDate: data.appointment_date,
              appointmentTime: data.appointment_time,
              serviceName,
              clientName,
              status: 'confirmed',
            });
          }
        } else if (status === 'cancelled') {
          await NotificationService.notifyAppointmentCancellation(
            data.client_id,
            {
              id: data.id,
              provider_name: providerName,
            },
            true // isClient
          );

          if (providerUserId) {
            await NotificationService.notifyAppointmentCancellation(
              providerUserId,
              {
                id: data.id,
                provider_name: providerName,
                client_name: clientName,
              },
              false // notify provider
            );
          }

          if (data.employee_id) {
            await this.notifyEmployeeAssignment(data.employee_id, {
              appointmentId: data.id,
              providerName,
              appointmentDate: data.appointment_date,
              appointmentTime: data.appointment_time,
              serviceName,
              clientName,
              status: 'cancelled',
            });
          }
        }
      } catch (notificationError) {
        console.error('Error sending status notification:', notificationError);
        // No fallar la operación principal por error de notificación
      }

      return data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  static async updateAppointmentPayment(
    appointmentId: string,
    paymentStatus: 'pending' | 'paid' | 'partial',
    paymentMethod?: 'cash' | 'zelle' | 'pago_movil' | 'card' | 'other'
  ): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (error) throw error;
  }

  // 📍 Confirmar cita (método específico)
  static async confirmAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  }

  // 📍 Cancelar cita (método específico)
  static async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
  }

  // 📍 Marcar cita como no-show
  static async markAppointmentNoShow(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'no_show');
  }

  // 📍 Actualizar cita (para reprogramación)
  static async updateAppointment(
    appointmentId: string,
    updateData: {
      appointment_date?: string;
      appointment_time?: string;
      service_id?: string;
      notes?: string;
    }
  ): Promise<Appointment> {
    try {
      console.log('🔴 [BOOKING SERVICE] Updating appointment:', appointmentId, updateData);

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🔴 [BOOKING SERVICE] Authenticated user:', user.id);

      // First, get the current appointment to check permissions
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('client_id, provider_id, service_id, appointment_date, appointment_time, employee_id')
        .eq('id', appointmentId)
        .single();

      if (fetchError) {
        console.error('🔴 [BOOKING SERVICE] Error fetching appointment:', fetchError);
        throw new Error(`No se pudo obtener la cita: ${fetchError.message}`);
      }

      console.log('🔴 [BOOKING SERVICE] Current appointment:', currentAppointment);

      // Check if user is either the client or the provider
      let hasPermission = false;
      if (currentAppointment.client_id === user.id) {
        hasPermission = true;
        console.log('🔴 [BOOKING SERVICE] User is the client - permission granted');
      } else {
        // Check if user is the provider
        const provider = await this.getProviderById(user.id);
        if (provider && provider.id === currentAppointment.provider_id) {
          hasPermission = true;
          console.log('🔴 [BOOKING SERVICE] User is the provider - permission granted');
        }
      }

      if (!hasPermission) {
        throw new Error('No tienes permisos para actualizar esta cita');
      }

      const targetDate = updateData.appointment_date || currentAppointment.appointment_date;
      const targetTime = updateData.appointment_time || currentAppointment.appointment_time;
      const targetServiceId = updateData.service_id || currentAppointment.service_id;

      if (targetDate && targetTime && (updateData.appointment_date || updateData.appointment_time || updateData.service_id)) {
        const validation = await this.validateAppointmentSlot({
          providerId: currentAppointment.provider_id,
          serviceId: targetServiceId,
          appointmentDate: targetDate,
          appointmentTime: targetTime,
          employeeId: currentAppointment.employee_id || undefined,
          ignoreAppointmentId: appointmentId,
        });

        if (!validation.ok) {
          throw new Error(validation.message || 'Este horario ya no está disponible.');
        }
      }

      // If date/time is being updated, we need to recalculate timestamps
      let updatePayload: any = { ...updateData };

      if (updateData.appointment_date && updateData.appointment_time) {
        const startTimestamp = new Date(`${updateData.appointment_date}T${updateData.appointment_time}:00`).toISOString();

        // Get service duration to calculate end timestamp
        let durationMinutes = 30; // default
        if (targetServiceId) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', targetServiceId)
            .single();

          durationMinutes = serviceData?.duration_minutes || 30;
        }

        const endTimestamp = new Date(new Date(startTimestamp).getTime() + durationMinutes * 60000).toISOString();

        updatePayload.start_ts = startTimestamp;
        updatePayload.end_ts = endTimestamp;
      }

      console.log('🔴 [BOOKING SERVICE] Update payload:', updatePayload);

      const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', appointmentId)
        .select('*')
        .single();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error updating appointment:', error);
        throw new Error(`Error al actualizar la cita: ${error.message}`);
      }

      console.log('🔴 [BOOKING SERVICE] ✅ Appointment updated successfully:', data);

      // Notify employee if assigned
      if (data.employee_id) {
        try {
          const [{ data: providerDetails }, { data: clientProfile }, { data: serviceData }] = await Promise.all([
            supabase
              .from('providers')
              .select('business_name')
              .eq('id', data.provider_id)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('display_name, full_name')
              .eq('id', data.client_id)
              .maybeSingle(),
            supabase
              .from('services')
              .select('name')
              .eq('id', data.service_id)
              .maybeSingle(),
          ]);

          const providerName = providerDetails?.business_name || 'Tu negocio';
          const clientName =
            clientProfile?.display_name ||
            clientProfile?.full_name ||
            'Cliente';

          await this.notifyEmployeeAssignment(data.employee_id, {
            appointmentId: data.id,
            providerName,
            appointmentDate: data.appointment_date,
            appointmentTime: data.appointment_time,
            serviceName: serviceData?.name,
            clientName,
            status: 'updated',
          });
        } catch (notifyError) {
          console.warn('⚠️ [BOOKING SERVICE] Error notifying employee of update:', notifyError);
        }
      }

      return data;
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error updating appointment:', error);
      throw error;
    }
  }

  // 📍 Obtener reseñas de un proveedor
  static async getProviderReviews(providerId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider reviews:', error);
      throw error;
    }
  }

  // 📍 Verificar si existe una reseña para una cita
  static async getExistingReview(appointmentId: string): Promise<Review | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .eq('client_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - no existing review
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking existing review:', error);
      return null;
    }
  }

  // 📍 Actualizar reseña existente
  static async updateReview(
    reviewId: string,
    rating: number,
    comment?: string
  ): Promise<Review> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      console.log('🔴 [BOOKING SERVICE] Updating review:', { reviewId, rating, comment });

      const updateData: any = {
        rating,
        comment: comment || null
      };

      console.log('🔴 [BOOKING SERVICE] Update data:', updateData);

      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId)
        .eq('client_id', user.id) // Ensure user owns the review
        .select('*')
        .single();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Supabase update error:', error);
        console.error('🔴 [BOOKING SERVICE] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Get the appointment info to update provider rating and send notification
      const { data: appointment } = await supabase
        .from('appointments')
        .select('provider_id')
        .eq('id', data.appointment_id)
        .single();

      if (appointment) {
        // Update provider rating
        try {
          await this.updateProviderRating(appointment.provider_id);
          console.log('🎉 [BOOKING SERVICE] Provider rating updated after review update');
        } catch (ratingError) {
          console.error('🔴 [BOOKING SERVICE] Error updating provider rating after review update:', ratingError);
          // Don't fail the review update if rating update fails
          // The database trigger should handle this as fallback
        }

        // Send notification about updated review
        try {
          await NotificationService.sendPushNotification(appointment.provider_id, {
            title: 'Calificación Actualizada ⭐',
            body: `Un cliente actualizó su calificación a ${rating} estrellas`,
            data: {
              type: 'updated_review',
              appointment_id: data.appointment_id,
              rating,
            },
          });
        } catch (notificationError) {
          console.error('Error sending updated review notification:', notificationError);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // 📍 Crear reseña
  static async createReview(
    appointmentId: string,
    rating: number,
    comment?: string
  ): Promise<Review> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener información de la cita
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('provider_id')
        .eq('id', appointmentId)
        .eq('client_id', user.id)
        .single();

      if (appointmentError) throw appointmentError;

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          appointment_id: appointmentId,
          client_id: user.id,
          provider_id: appointment.provider_id,
          rating,
          comment: comment || null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Actualizar rating promedio del proveedor
      try {
        await this.updateProviderRating(appointment.provider_id);
        console.log('🎉 [BOOKING SERVICE] Provider rating updated after review creation');
      } catch (ratingError) {
        console.error('🔴 [BOOKING SERVICE] Error updating provider rating after review creation:', ratingError);
        // Don't fail the review creation if rating update fails
        // The database trigger should handle this as fallback
      }

      // Enviar notificación al proveedor sobre la nueva calificación
      try {
        await NotificationService.sendPushNotification(appointment.provider_id, {
          title: 'Nueva Calificación ⭐',
          body: `Has recibido una calificación de ${rating} estrellas`,
          data: {
            type: 'new_review',
            appointment_id: appointmentId,
            rating,
          },
        });
      } catch (notificationError) {
        console.error('Error sending review notification:', notificationError);
        // No fallar la operación principal por error de notificación
      }

      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // 📍 Actualizar rating promedio del proveedor (usando función segura de DB)
  static async updateProviderRating(providerId: string): Promise<void> {
    try {
      console.log('🔴 [BOOKING SERVICE] Updating provider rating for:', providerId);

      // Use secure database function that bypasses RLS
      const { data, error } = await supabase
        .rpc('update_provider_rating_secure', {
          provider_uuid: providerId
        });

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error calling rating function:', error);
        throw error;
      }

      console.log('🔴 [BOOKING SERVICE] Rating function response:', data);

      if (data && !data.success) {
        const errorMsg = data.error || 'Unknown error updating provider rating';
        console.error('🔴 [BOOKING SERVICE] Rating function failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('🎉 [BOOKING SERVICE] ✅ Provider rating updated successfully!', {
        providerId,
        newRating: data?.new_rating,
        reviewCount: data?.review_count
      });

    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error updating provider rating:', error);
      // Fallback: Try direct update (will fail due to RLS but helps with debugging)
      console.log('🔄 [BOOKING SERVICE] Attempting fallback direct update...');
      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('provider_id', providerId);

        if (reviewsError) throw reviewsError;

        let newRating = 0;
        let reviewCount = 0;

        if (reviews && reviews.length > 0) {
          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          newRating = Math.round(averageRating * 100) / 100;
          reviewCount = reviews.length;
        }

        const { error: updateError } = await supabase
          .from('providers')
          .update({
            rating: newRating,
            total_reviews: reviewCount
          })
          .eq('id', providerId);

        if (updateError) {
          console.error('🔴 [BOOKING SERVICE] Fallback update also failed (likely RLS):', updateError);
          throw updateError;
        }

        console.log('🎉 [BOOKING SERVICE] ✅ Fallback update succeeded!');

      } catch (fallbackError) {
        console.error('🔴 [BOOKING SERVICE] Fallback update failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  // 🔄 Recalcular ratings de todos los proveedores
  static async recalculateAllProviderRatings(): Promise<void> {
    try {
      console.log('🔄 [BOOKING SERVICE] Recalculating all provider ratings...');

      // Get all providers
      const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('id')
        .eq('is_active', true);

      if (providersError) throw providersError;

      if (!providers || providers.length === 0) {
        console.log('🚨 [BOOKING SERVICE] No providers found');
        return;
      }

      console.log(`🔴 [BOOKING SERVICE] Found ${providers.length} providers to update`);

      // Update each provider
      let updated = 0;
      let errors = 0;

      for (const provider of providers) {
        try {
          await this.updateProviderRating(provider.id);
          updated++;
          console.log(`🎉 [BOOKING SERVICE] Updated provider ${provider.id} (${updated}/${providers.length})`);
        } catch (error) {
          errors++;
          console.error(`🔴 [BOOKING SERVICE] Error updating provider ${provider.id}:`, error);
        }
      }

      console.log(`🎉 [BOOKING SERVICE] ✅ Recalculation complete! Updated: ${updated}, Errors: ${errors}`);

    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error recalculating all provider ratings:', error);
      throw error;
    }
  }

  // 📍 Verificar si una cita puede ser calificada
  static async canRateAppointment(appointmentId: string): Promise<boolean> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('status, appointment_date')
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        return false;
      }

      // Solo se puede calificar si está completada y es de hoy o anterior
      const appointmentDate = new Date(appointment.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return appointment.status === 'done' && appointmentDate <= today;
    } catch (error) {
      console.error('Error checking if appointment can be rated:', error);
      return false;
    }
  }

  // ✏️ Crear proveedor y automáticamente crear el propietario como empleado
  static async createProvider(providerData: {
    user_id: string;
    name: string;
    business_name: string;
    category: string;
    bio?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;

  }): Promise<Provider> {
    try {
      // Crear el proveedor
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: providerData.user_id,
          name: providerData.name,
          business_name: providerData.business_name,
          category: providerData.category,
          bio: providerData.bio || '',
          address: providerData.address || '',
          phone: providerData.phone || '',
          email: providerData.email || '',
          timezone: 'America/Caracas',
          rating: 0.0,
          total_reviews: 0,
          is_active: providerData.is_active ?? true,
        })
        .select('id, user_id, name, business_name, category, bio, address, phone, email, logo_url, lat, lng, timezone, rating, total_reviews, is_active, created_at, updated_at')
        .single();

      if (providerError) throw providerError;

      // Automáticamente crear el propietario como empleado
      try {
        // Get the user profile to get the display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', providerData.user_id)
          .single();

        const ownerName = profile?.display_name || providerData.name;

        await this.createEmployee({
          provider_id: provider.id,
          name: ownerName,
          position: 'Propietario',
          bio: 'Propietario del negocio',
          is_owner: true,
          is_active: true,
          custom_schedule_enabled: false,
          profile_id: providerData.user_id,
          email: providerData.email || null,
          inviteStatus: 'accepted',
          role: 'owner',
        });
        console.log('✅ [BOOKING SERVICE] Owner created as employee automatically');
      } catch (employeeError) {
        console.warn('⚠️ [BOOKING SERVICE] Could not create owner as employee:', employeeError);
        // No fallar la creación del proveedor por esto
      }

      return provider;
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  // ❌ Desactivar negocio y limpiar datos principales
  static async deactivateProviderAccount(userId: string): Promise<void> {
    console.log('🔴 [BOOKING SERVICE] Desactivando negocio para usuario:', userId);

    const provider = await this.getProviderById(userId);
    if (!provider) {
      console.log('🔴 [BOOKING SERVICE] No se encontró proveedor para desactivar');
      return;
    }

    const { error: servicesError } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('provider_id', provider.id);

    if (servicesError) {
      console.error('🔴 [BOOKING SERVICE] Error desactivando servicios:', servicesError);
    }

    const { error: availabilityError } = await supabase
      .from('availabilities')
      .delete()
      .eq('provider_id', provider.id);

    if (availabilityError) {
      console.error('🔴 [BOOKING SERVICE] Error eliminando disponibilidades:', availabilityError);
    }

    const { error: employeesError } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('provider_id', provider.id);

    if (employeesError) {
      console.error('🔴 [BOOKING SERVICE] Error desactivando empleados:', employeesError);
    }

    const { error: providerError } = await supabase
      .from('providers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', provider.id);

    if (providerError) {
      console.error('🔴 [BOOKING SERVICE] Error desactivando proveedor:', providerError);
      throw providerError;
    }

    console.log('🔴 [BOOKING SERVICE] ✅ Negocio desactivado correctamente');
  }

  // ❌ Eliminar cuenta de cliente
  static async deleteClientAccount(userId: string): Promise<void> {
    console.log('🔴 [BOOKING SERVICE] Eliminando cuenta de cliente:', userId);

    // 1. Eliminar perfil (esto debería disparar ON DELETE CASCADE para citas, reviews, etc. si está configurado)
    // Si no, lo hacemos manual
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('🔴 [BOOKING SERVICE] Error eliminando perfil:', error);
      throw error;
    }

    // Nota: La eliminación del usuario de auth.users debe hacerse vía RPC o Edge Function con service_role
    // Por ahora, eliminamos los datos públicos.
    console.log('🔴 [BOOKING SERVICE] Cuenta de cliente eliminada (datos públicos)');
  }

  static async updateProvider(
    providerId: string,
    updateData: {
      business_name?: string;
      category?: string;
      description?: string;
      address?: string;
      phone?: string;
      email?: string;
      logo_url?: string;
      hero_image_url?: string;
    }
  ): Promise<Provider | null> {
    try {
      console.log('🔴 [BOOKING SERVICE] Actualizando proveedor:', providerId, updateData);

      const { data, error } = await supabase
        .from('providers')
        .update({
          business_name: updateData.business_name,
          category: updateData.category,
          bio: updateData.description,
          address: updateData.address,
          phone: updateData.phone,
          email: updateData.email,
          logo_url: updateData.logo_url,
          hero_image_url: updateData.hero_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', providerId)
        .select()
        .single();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error updating provider:', error);
        throw error;
      }

      console.log('🔴 [BOOKING SERVICE] Proveedor actualizado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error updating provider:', error);
      throw error;
    }
  }

  static async updateAvailability(
    userId: string,
    availability: Record<string, { enabled: boolean; startTime: string; endTime: string }>
  ): Promise<void> {
    try {
      console.log('🔴 [BOOKING SERVICE] Actualizando disponibilidad para userId:', userId, availability);

      // First, get the provider record to get the correct provider_id
      const provider = await this.getProviderById(userId);
      if (!provider) {
        throw new Error('Provider not found for user');
      }

      console.log('🔴 [BOOKING SERVICE] Provider encontrado:', provider.id);

      // Mapeo de días de la semana
      const weekdayMap: Record<string, number> = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
      };

      // Primero, eliminar todas las disponibilidades existentes del proveedor
      const { error: deleteError } = await supabase
        .from('availabilities')
        .delete()
        .eq('provider_id', provider.id);

      if (deleteError) {
        console.error('🔴 [BOOKING SERVICE] Error deleting existing availability:', deleteError);
        throw deleteError;
      }

      // Crear nuevas disponibilidades para los días habilitados
      const availabilityRecords = Object.entries(availability)
        .filter(([_, dayData]) => dayData.enabled)
        .map(([dayKey, dayData]) => ({
          provider_id: provider.id,
          weekday: weekdayMap[dayKey],
          start_time: dayData.startTime,
          end_time: dayData.endTime
        }));

      console.log('🔴 [BOOKING SERVICE] Records to insert:', availabilityRecords);

      if (availabilityRecords.length > 0) {
        // Try with is_active first, fall back without if it fails
        const recordsWithActive = availabilityRecords.map(record => ({ ...record, is_active: true }));

        let { error: insertError } = await supabase
          .from('availabilities')
          .insert(recordsWithActive);

        // If it fails with is_active column, try without it
        if (insertError && insertError.message?.includes('is_active')) {
          console.log('🔴 [BOOKING SERVICE] Retrying without is_active column...');
          const { error: retryError } = await supabase
            .from('availabilities')
            .insert(availabilityRecords);

          if (retryError) {
            console.error('🔴 [BOOKING SERVICE] Error inserting availability (retry):', retryError);
            throw retryError;
          }
        } else if (insertError) {
          console.error('🔴 [BOOKING SERVICE] Error inserting availability:', insertError);
          throw insertError;
        }
      }

      console.log('🔴 [BOOKING SERVICE] ✅ Disponibilidad actualizada exitosamente');
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error updating availability:', error);
      throw error;
    }
  }

  // 🔄 Check data consistency for availability
  static async checkAvailabilityConsistency(userId: string): Promise<void> {
    try {
      console.log('🔴 [BOOKING SERVICE] Checking availability consistency for userId:', userId);

      // Get the provider record
      const provider = await this.getProviderById(userId);
      if (!provider) {
        console.log('🔴 [BOOKING SERVICE] No provider found, skipping consistency check');
        return;
      }

      // Check for duplicate or orphaned availability records
      const { data: availabilities, error } = await supabase
        .from('availabilities')
        .select('*')
        .eq('provider_id', provider.id);

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error checking availabilities:', error);
        return;
      }

      console.log('🔴 [BOOKING SERVICE] Found', availabilities?.length || 0, 'availability records');

      // Group by weekday to find duplicates
      const weekdayGroups: Record<number, any[]> = {};
      availabilities?.forEach(av => {
        if (!weekdayGroups[av.weekday]) {
          weekdayGroups[av.weekday] = [];
        }
        weekdayGroups[av.weekday].push(av);
      });

      // Remove duplicates, keeping the most recent
      for (const [weekday, records] of Object.entries(weekdayGroups)) {
        if (records.length > 1) {
          console.log('🔴 [BOOKING SERVICE] Found duplicate availability records for weekday', weekday);

          // Sort by created_at and keep the most recent
          records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const toDelete = records.slice(1); // Keep first (most recent), delete rest

          for (const record of toDelete) {
            const { error: deleteError } = await supabase
              .from('availabilities')
              .delete()
              .eq('id', record.id);

            if (deleteError) {
              console.error('🔴 [BOOKING SERVICE] Error deleting duplicate:', deleteError);
            } else {
              console.log('🔴 [BOOKING SERVICE] Deleted duplicate availability record:', record.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error in consistency check:', error);
    }
  }

  // ✂️ Create a new service for a provider
  static async createService(
    userId: string,
    serviceData: {
      name: string;
      description?: string;
      price_amount: number;
      price_currency?: string;
      duration_minutes: number;
      is_active?: boolean;
    }
  ): Promise<Service> {
    try {
      console.log('🔴 [BOOKING SERVICE] Creating service for userId:', userId, serviceData);

      // Check authentication state
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔴 [BOOKING SERVICE] Auth user:', authUser?.id, authUser?.email);
      console.log('🔴 [BOOKING SERVICE] Auth error:', authError);

      if (!authUser) {
        throw new Error('Usuario no autenticado. Inicia sesión para crear servicios.');
      }

      if (authUser.id !== userId) {
        console.log('🔴 [BOOKING SERVICE] Auth user ID mismatch:', { authUserId: authUser.id, requestedUserId: userId });
        throw new Error('No tienes permisos para crear servicios para este usuario.');
      }

      // Also check the session to ensure it's active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔴 [BOOKING SERVICE] Session active:', !!session);
      console.log('🔴 [BOOKING SERVICE] Session error:', sessionError);

      if (!session) {
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
      }

      // Get the provider record to get the correct provider_id
      const provider = await this.getProviderById(userId);
      if (!provider) {
        throw new Error('Provider not found for user');
      }

      console.log('🔴 [BOOKING SERVICE] Provider encontrado:', provider.id);

      const { data, error } = await supabase
        .from('services')
        .insert({
          provider_id: provider.id,
          name: serviceData.name,
          description: serviceData.description || null,
          price_amount: serviceData.price_amount,
          price_currency: serviceData.price_currency || 'USD',
          duration_minutes: serviceData.duration_minutes,
          is_active: serviceData.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error creating service:', error);
        throw error;
      }

      console.log('🔴 [BOOKING SERVICE] ✅ Service created successfully:', data);
      return data;
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error creating service:', error);
      throw error;
    }
  }

  // ✏️ Update an existing service
  static async updateService(
    serviceId: string,
    serviceData: {
      name?: string;
      description?: string;
      price_amount?: number;
      price_currency?: string;
      duration_minutes?: number;
      is_active?: boolean;
    }
  ): Promise<Service> {
    try {
      console.log('🔴 [BOOKING SERVICE] Updating service:', serviceId, serviceData);

      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error updating service:', error);
        throw error;
      }

      console.log('🔴 [BOOKING SERVICE] ✅ Service updated successfully:', data);
      return data;
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error updating service:', error);
      throw error;
    }
  }

  // 🗑️ Delete a service
  static async deleteService(serviceId: string): Promise<void> {
    try {
      console.log('🔴 [BOOKING SERVICE] Deleting service:', serviceId);

      // First check if there are any appointments using this service
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('service_id', serviceId);

      if (appointmentsError) {
        console.error('🔴 [BOOKING SERVICE] Error checking appointments:', appointmentsError);
        throw appointmentsError;
      }

      if (appointments && appointments.length > 0) {
        console.log('🔴 [BOOKING SERVICE] Found', appointments.length, 'appointments using this service');

        // Check if any are pending or confirmed
        const activeAppointments = appointments.filter(apt =>
          apt.status === 'pending' || apt.status === 'confirmed'
        );

        if (activeAppointments.length > 0) {
          throw new Error(
            `No se puede eliminar el servicio porque tiene ${activeAppointments.length} cita(s) pendiente(s) o confirmada(s). ` +
            'Cancela o completa las citas antes de eliminar el servicio.'
          );
        }
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('🔴 [BOOKING SERVICE] Error deleting service:', error);

        // Provide better error messages
        if (error.code === '23503') {
          throw new Error('No se puede eliminar el servicio porque tiene citas asociadas.');
        } else if (error.message?.includes('foreign key')) {
          throw new Error('No se puede eliminar el servicio porque está siendo usado por citas existentes.');
        } else {
          throw new Error(`Error al eliminar servicio: ${error.message}`);
        }
      }

      console.log('🔴 [BOOKING SERVICE] ✅ Service deleted successfully');
    } catch (error) {
      console.error('🔴 [BOOKING SERVICE] Error deleting service:', error);
      throw error;
    }
  }

  // ❤️ Favorites functionality

  // Get user's favorite providers
  static async getFavoriteProviders(): Promise<Provider[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          provider_id,
          providers!inner(
            id,
            user_id,
            name,
            business_name,
            bio,
            address,
            phone,
            email,
            logo_url,
            lat,
            lng,
            timezone,
            category,
            rating,
            total_reviews,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('providers.is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Array<{ provider_id: string; providers: Provider | Provider[] }>;
      const providersList = rows
        .map(row => (Array.isArray(row.providers) ? row.providers[0] : row.providers))
        .filter((provider): provider is Provider => Boolean(provider));

      return providersList;
    } catch (error) {
      console.error('Error getting favorite providers:', error);
      throw error;
    }
  }

  // Add provider to favorites
  static async addToFavorites(providerId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Check if already in favorites
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .single();

      if (existing) {
        // Already in favorites, no need to add again
        return;
      }

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          provider_id: providerId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove provider from favorites
  static async removeFromFavorites(providerId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('provider_id', providerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  private static timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTimeLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private static rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  // Check if provider is in user's favorites
  static async isProviderFavorite(providerId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider_id', providerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if provider is favorite:', error);
      return false;
    }
  }

  // Get favorite status for multiple providers
  static async getFavoriteStatuses(providerIds: string[]): Promise<Record<string, boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('user_favorites')
        .select('provider_id')
        .eq('user_id', user.id)
        .in('provider_id', providerIds);

      if (error) throw error;

      const favoriteStatuses: Record<string, boolean> = {};
      providerIds.forEach(id => {
        favoriteStatuses[id] = false;
      });

      data?.forEach(favorite => {
        favoriteStatuses[favorite.provider_id] = true;
      });

      return favoriteStatuses;
    } catch (error) {
      console.error('Error getting favorite statuses:', error);
      return {};
    }
  }

  // ---------------------------------------------------------------------------
  // CRM Lite Methods
  // ---------------------------------------------------------------------------

  static async getProviderClients(providerId: string): Promise<any[]> {
    try {
      // 1. Get all unique clients from appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('client_id, appointment_date, status, services(price_amount)')
        .eq('provider_id', providerId);

      if (error) throw error;

      if (!appointments || appointments.length === 0) return [];

      // 2. Group by client_id
      const clientStatsMap = new Map<string, {
        totalVisits: number;
        totalSpent: number;
        lastVisit: string | null;
        noShows: number;
      }>();

      appointments.forEach(apt => {
        const current = clientStatsMap.get(apt.client_id) || {
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: null,
          noShows: 0
        };

        if (apt.status === 'confirmed' || apt.status === 'done') {
          current.totalVisits++;
          current.totalSpent += (apt.services as any)?.price_amount || 0;
          if (!current.lastVisit || new Date(apt.appointment_date) > new Date(current.lastVisit)) {
            current.lastVisit = apt.appointment_date;
          }
        } else if (apt.status === 'cancelled' || apt.status === 'no_show') {
          // Assuming 'cancelled' might be no-show if late, but for now just counting explicit no-shows if we had that status
        }

        clientStatsMap.set(apt.client_id, current);
      });

      // 3. Fetch profile details for these clients
      const clientIds = Array.from(clientStatsMap.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .in('id', clientIds);

      if (profilesError) throw profilesError;

      // 4. Merge data
      return profiles.map(profile => ({
        ...profile,
        stats: clientStatsMap.get(profile.id)
      }));

    } catch (error) {
      console.error('Error fetching provider clients:', error);
      return [];
    }
  }

  static async getClientNotes(providerId: string, clientId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('provider_client_notes')
        .select('notes')
        .eq('provider_id', providerId)
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data?.notes || '';
    } catch (error) {
      console.error('Error fetching client notes:', error);
      return '';
    }
  }

  static async saveClientNotes(providerId: string, clientId: string, notes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_client_notes')
        .upsert({
          provider_id: providerId,
          client_id: clientId,
          notes: notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'provider_id, client_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving client notes:', error);
      throw error;
    }
  }

  static async getClientHistory(providerId: string, clientId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, price_amount, price_currency, duration_minutes)')
        .eq('provider_id', providerId)
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return (data || []) as Appointment[];
    } catch (error) {
      console.error('Error fetching client history:', error);
      return [];
    }
  }

  static async getExpiredPendingAppointments(providerId: string): Promise<Appointment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, price_amount, price_currency, duration_minutes), profiles(full_name, phone)')
        .eq('provider_id', providerId)
        .eq('status', 'pending')
        .lt('appointment_date', today)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Appointment[];
    } catch (error) {
      console.error('Error fetching expired pending appointments:', error);
      return [];
    }
  }
}
