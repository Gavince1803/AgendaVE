import { supabase } from './supabase';

export interface BookingService {
  id?: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  provider_id: string;
  is_active: boolean;
}

export interface BookingAvailability {
  id?: number;
  provider_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // Format: "09:00"
  end_time: string; // Format: "18:00"
  is_available: boolean;
}

export interface BookingAppointment {
  id?: number;
  client_id: string;
  provider_id: string;
  service_id: number;
  appointment_date: string; // Format: "2024-01-15"
  appointment_time: string; // Format: "14:30"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class BookingService {
  // Obtener servicios de un proveedor
  static async getProviderServices(providerId: string): Promise<BookingService[]> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Error al obtener servicios: ${error.message}`);
    }

    return data || [];
  }

  // Obtener disponibilidad de un proveedor
  static async getProviderAvailability(providerId: string): Promise<BookingAvailability[]> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_available', true)
      .order('day_of_week');

    if (error) {
      throw new Error(`Error al obtener disponibilidad: ${error.message}`);
    }

    return data || [];
  }

  // Verificar disponibilidad en una fecha y hora específica
  static async checkAvailability(
    providerId: string, 
    date: string, 
    time: string
  ): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Verificar si el proveedor está disponible en ese día
    const { data: availability, error: availabilityError } = await supabase
      .from('availabilities')
      .select('*')
      .eq('provider_id', providerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single();

    if (availabilityError || !availability) {
      return false;
    }

    // Verificar si la hora está dentro del rango de disponibilidad
    const requestedTime = time;
    if (requestedTime < availability.start_time || requestedTime > availability.end_time) {
      return false;
    }

    // Verificar si ya hay una cita en esa fecha y hora
    const { data: existingAppointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id')
      .eq('provider_id', providerId)
      .eq('appointment_date', date)
      .eq('appointment_time', time)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (appointmentError && appointmentError.code !== 'PGRST116') {
      throw new Error(`Error al verificar disponibilidad: ${appointmentError.message}`);
    }

    return !existingAppointment;
  }

  // Crear una nueva reserva
  static async createBooking(bookingData: Omit<BookingAppointment, 'id' | 'created_at' | 'updated_at'>): Promise<BookingAppointment> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    // Verificar disponibilidad antes de crear la reserva
    const isAvailable = await this.checkAvailability(
      bookingData.provider_id,
      bookingData.appointment_date,
      bookingData.appointment_time
    );

    if (!isAvailable) {
      throw new Error('El horario seleccionado no está disponible');
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        client_id: bookingData.client_id,
        provider_id: bookingData.provider_id,
        service_id: bookingData.service_id,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        status: bookingData.status,
        notes: bookingData.notes,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear la reserva: ${error.message}`);
    }

    return data;
  }

  // Obtener citas de un cliente
  static async getClientAppointments(clientId: string): Promise<BookingAppointment[]> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services:service_id (
          name,
          price,
          duration
        ),
        providers:provider_id (
          name,
          category
        )
      `)
      .eq('client_id', clientId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener citas: ${error.message}`);
    }

    return data || [];
  }

  // Obtener citas de un proveedor
  static async getProviderAppointments(providerId: string): Promise<BookingAppointment[]> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services:service_id (
          name,
          price,
          duration
        ),
        profiles:client_id (
          full_name,
          email
        )
      `)
      .eq('provider_id', providerId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener citas: ${error.message}`);
    }

    return data || [];
  }

  // Actualizar estado de una cita
  static async updateAppointmentStatus(
    appointmentId: number, 
    status: BookingAppointment['status']
  ): Promise<BookingAppointment> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar cita: ${error.message}`);
    }

    return data;
  }

  // Cancelar una cita
  static async cancelAppointment(appointmentId: number): Promise<BookingAppointment> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
  }

  // Confirmar una cita
  static async confirmAppointment(appointmentId: number): Promise<BookingAppointment> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  }

  // Completar una cita
  static async completeAppointment(appointmentId: number): Promise<BookingAppointment> {
    return this.updateAppointmentStatus(appointmentId, 'completed');
  }

  // Obtener horarios disponibles para una fecha específica
  static async getAvailableTimeSlots(
    providerId: string, 
    date: string
  ): Promise<string[]> {
    if (!supabase) {
      throw new Error('Supabase no está configurado');
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Obtener disponibilidad del proveedor para ese día
    const { data: availability, error: availabilityError } = await supabase
      .from('availabilities')
      .select('*')
      .eq('provider_id', providerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single();

    if (availabilityError || !availability) {
      return [];
    }

    // Obtener citas existentes para esa fecha
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('provider_id', providerId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']);

    if (appointmentsError) {
      throw new Error(`Error al obtener citas existentes: ${appointmentsError.message}`);
    }

    const bookedTimes = existingAppointments?.map(apt => apt.appointment_time) || [];

    // Generar horarios disponibles
    const availableSlots: string[] = [];
    const startTime = availability.start_time;
    const endTime = availability.end_time;
    const interval = 30; // 30 minutos

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      
      if (!bookedTimes.includes(timeString)) {
        availableSlots.push(timeString);
      }

      currentMin += interval;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }

    return availableSlots;
  }
}
