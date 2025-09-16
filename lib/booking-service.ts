// 📅 Servicio de Reservas y Gestión de Citas
import { NotificationService } from './notification-service';
import { supabase } from './supabase';

export interface Provider {
  id: string;
  owner_id: string;
  user_id?: string;
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

export interface Appointment {
  id: string;
  client_id: string;
  provider_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
  note?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: Service;
  provider?: Provider;
  client?: {
    id: string;
    full_name?: string;
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
  // Joined data
  client?: {
    id: string;
    full_name?: string;
    display_name?: string;
  };
}

export class BookingService {
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
        .eq('owner_id', userId)
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

  // 📍 Obtener servicios de un proveedor
  static async getProviderServices(providerId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  }

  // 📍 Obtener disponibilidad de un proveedor
  static async getProviderAvailability(providerId: string): Promise<Availability[]> {
    try {
      const { data, error } = await supabase
        .from('availabilities')
        .select('*')
        .eq('provider_id', providerId)
        .order('weekday, start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider availability:', error);
      throw error;
    }
  }

  // 📍 Obtener horarios disponibles para una fecha específica
  static async getAvailableSlots(providerId: string, date: string): Promise<string[]> {
    try {
      // Obtener disponibilidad del proveedor
      const availability = await this.getProviderAvailability(providerId);
      
      // Obtener citas existentes para esa fecha
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, services(duration_minutes)')
        .eq('provider_id', providerId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      if (appointmentsError) throw appointmentsError;

      // Obtener servicios del proveedor para calcular duración
      const services = await this.getProviderServices(providerId);
      
      // Generar slots disponibles
      const availableSlots: string[] = [];
      const dayOfWeek = new Date(date).getDay();
      
      // Encontrar disponibilidad para este día
      const dayAvailability = availability.find(a => a.weekday === dayOfWeek);
      if (!dayAvailability) return availableSlots;

      // Generar slots de 30 minutos
      const startTime = new Date(`2000-01-01T${dayAvailability.start_time}`);
      const endTime = new Date(`2000-01-01T${dayAvailability.end_time}`);
      
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        
        // Verificar si este slot está disponible
        const isAvailable = !existingAppointments?.some(apt => {
          const aptTime = new Date(`2000-01-01T${apt.appointment_time}`);
          const service = services.find(s => s.id === apt.service_id);
          const duration = service?.duration_minutes || 60;
          
          const slotStart = currentTime.getTime();
          const slotEnd = slotStart + (30 * 60 * 1000); // 30 minutos
          const aptStart = aptTime.getTime();
          const aptEnd = aptStart + (duration * 60 * 1000);
          
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        if (isAvailable) {
          availableSlots.push(timeString);
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }

      return availableSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  // 📍 Crear una nueva cita
  static async createAppointment(
    providerId: string,
    serviceId: string,
    appointmentDate: string,
    appointmentTime: string,
    notes?: string
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          provider_id: providerId,
          service_id: serviceId,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: 'pending',
          notes: notes || null
        })
        .select(`
          *,
          service:services(*),
          provider:providers(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // 📍 Obtener citas del cliente
  static async getClientAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          provider:providers(*)
        `)
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      throw error;
    }
  }

  // 📍 Obtener citas del proveedor
  static async getProviderAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          client:profiles(id, display_name, phone)
        `)
        .eq('provider_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider appointments:', error);
      throw error;
    }
  }

  // 📍 Actualizar estado de cita (confirmar/rechazar)
  static async updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'cancelled' | 'done'
  ): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select(`
          *,
          service:services(*),
          provider:providers(*),
          client:profiles(id, display_name, phone)
        `)
        .single();

      if (error) throw error;

      // Enviar notificaciones según el estado
      try {
        if (status === 'confirmed') {
          await NotificationService.notifyAppointmentConfirmation(
            data.client_id,
            {
              id: data.id,
              provider_name: data.provider?.business_name,
              appointment_date: data.appointment_date,
            }
          );
        } else if (status === 'cancelled') {
          await NotificationService.notifyAppointmentCancellation(
            data.client_id,
            {
              id: data.id,
              provider_name: data.provider?.business_name,
            },
            true // isClient
          );
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
        .select(`
          *,
          client:profiles(id, display_name)
        `)
        .single();

      if (error) throw error;

      // Actualizar rating promedio del proveedor
      await this.updateProviderRating(appointment.provider_id);

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

  // 📍 Actualizar rating promedio del proveedor
  static async updateProviderRating(providerId: string): Promise<void> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (error) throw error;

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        await supabase
          .from('providers')
          .update({
            rating: Math.round(averageRating * 100) / 100,
            total_reviews: reviews.length
          })
          .eq('id', providerId);
      }
    } catch (error) {
      console.error('Error updating provider rating:', error);
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

  // ✏️ Actualizar información del proveedor
  static async createProvider(providerData: {
    owner_id: string;
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
      const { data, error } = await supabase
        .from('providers')
        .insert({
          owner_id: providerData.owner_id,
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
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
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
          updated_at: new Date().toISOString(),
        })
        .eq('owner_id', providerId)
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
}
