// 📅 Servicio de Reservas y Gestión de Citas
import { NotificationService } from './notification-service';
import { supabase } from './supabase';

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
  is_active: boolean;
  is_owner: boolean;
  profile_image_url?: string;
  custom_schedule_enabled: boolean;
  bio?: string;
  created_at: string;
  updated_at: string;
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'done';
  note?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: Service;
  provider?: Provider;
  employee?: Employee;
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

  // 👥 Obtener empleados de un proveedor
  static async getProviderEmployees(providerId: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('is_owner', { ascending: false }) // Owners first
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider employees:', error);
      throw error;
    }
  }

  // 👥 Obtener disponibilidad de un empleado
  static async getEmployeeAvailability(employeeId: string, dayOfWeek: number): Promise<{start_time: string, end_time: string, is_available: boolean}[]> {
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
  }): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          provider_id: employeeData.provider_id,
          name: employeeData.name,
          position: employeeData.position || 'Empleado',
          bio: employeeData.bio || '',
          is_owner: employeeData.is_owner || false,
          is_active: employeeData.is_active ?? true,
          custom_schedule_enabled: employeeData.custom_schedule_enabled || false,
          profile_image_url: employeeData.profile_image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
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
      console.log('🔴 [GET SLOTS] Getting available slots for:', { providerId, date, serviceId });
      
      // Obtener duración del servicio si se proporciona
      let serviceDuration = 30; // Default to 30 minutes
      if (serviceId) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single();
        serviceDuration = serviceData?.duration_minutes || 30;
        console.log('🔴 [GET SLOTS] Service duration:', serviceDuration, 'minutes');
      }
      
      // Obtener disponibilidad del proveedor
      const availability = await this.getProviderAvailability(providerId);
      console.log('🔴 [GET SLOTS] Provider availability:', availability);
      
      // Obtener citas existentes para esa fecha
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, services(duration_minutes)')
        .eq('provider_id', providerId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      if (appointmentsError) throw appointmentsError;
      console.log('🔴 [GET SLOTS] Existing appointments:', existingAppointments);
      
      // Obtener servicios del proveedor para calcular duración
      const services = await this.getProviderServices(providerId);
      console.log('🔴 [GET SLOTS] Provider services:', services);
      
      // Generar slots disponibles
      const availableSlots: string[] = [];
      const dayOfWeek = new Date(date).getDay();
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log('🔴 [GET SLOTS] Date analysis:', {
        date,
        dayOfWeek,
        dayName: weekdayNames[dayOfWeek],
        availabilityCount: availability.length
      });
      
      // Encontrar disponibilidad para este día
      const dayAvailability = availability.find(a => a.weekday === dayOfWeek);
      console.log('🔴 [GET SLOTS] Day availability for', weekdayNames[dayOfWeek], ':', dayAvailability);
      
      if (!dayAvailability) {
        console.log('🔴 [GET SLOTS] ❌ No availability found for', weekdayNames[dayOfWeek], '- returning empty slots');
        return availableSlots;
      }

      // Generar slots de 30 minutos
      const startTime = new Date(`2000-01-01T${dayAvailability.start_time}`);
      const endTime = new Date(`2000-01-01T${dayAvailability.end_time}`);
      
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        
        // Calcular tiempo de fin del servicio seleccionado
        const slotStart = currentTime.getTime();
        const slotEnd = slotStart + (serviceDuration * 60 * 1000);
        
        // Check if service would extend beyond availability period
        if (slotEnd > endTime.getTime()) {
          console.log('🔴 [GET SLOTS] Service would extend beyond availability for slot:', timeString);
          break; // No more slots can fit the full service duration
        }
        
        // Verificar si este slot y toda su duración están disponibles
        const hasConflict = existingAppointments?.some(apt => {
          const aptTime = new Date(`2000-01-01T${apt.appointment_time}`);
          const service = services.find(s => s.id === apt.service_id);
          const aptDuration = service?.duration_minutes || apt.services?.duration_minutes || 60;
          
          const aptStart = aptTime.getTime();
          const aptEnd = aptStart + (aptDuration * 60 * 1000);
          
          // Check if there's any overlap between the new service slot and existing appointment
          const overlap = (slotStart < aptEnd && slotEnd > aptStart);
          if (overlap) {
            console.log('🔴 [GET SLOTS] Conflict detected for slot', timeString, '- overlaps with appointment at', apt.appointment_time);
          }
          return overlap;
        });

        if (!hasConflict) {
          availableSlots.push(timeString);
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }

      console.log('🔴 [GET SLOTS] Final available slots:', availableSlots);
      return availableSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  // 👥 Obtener horarios disponibles para un empleado específico
  static async getEmployeeAvailableSlots(employeeId: string, providerId: string, date: string, serviceId?: string): Promise<string[]> {
    try {
      console.log('🔴 [GET EMPLOYEE SLOTS] Getting available slots for employee:', { employeeId, providerId, date, serviceId });
      
      // Obtener duración del servicio si se proporciona
      let serviceDuration = 30; // Default to 30 minutes
      if (serviceId) {
        const { data: serviceData } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', serviceId)
          .single();
        serviceDuration = serviceData?.duration_minutes || 30;
        console.log('🔴 [GET EMPLOYEE SLOTS] Service duration:', serviceDuration, 'minutes');
      }
      
      const dayOfWeek = new Date(date).getDay();
      
      // Obtener disponibilidad específica del empleado
      const employeeAvailability = await this.getEmployeeAvailability(employeeId, dayOfWeek);
      console.log('🔴 [GET EMPLOYEE SLOTS] Employee availability:', employeeAvailability);
      
      if (!employeeAvailability || employeeAvailability.length === 0 || !employeeAvailability[0]?.is_available) {
        console.log('🔴 [GET EMPLOYEE SLOTS] ❌ No availability found for employee');
        return [];
      }
      
      const dayAvailability = employeeAvailability[0];
      
      // Obtener citas existentes para esa fecha y empleado
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, services(duration_minutes)')
        .eq('provider_id', providerId)
        .eq('employee_id', employeeId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      if (appointmentsError) throw appointmentsError;
      console.log('🔴 [GET EMPLOYEE SLOTS] Existing appointments for employee:', existingAppointments);
      
      // Obtener servicios del proveedor para calcular duración
      const services = await this.getProviderServices(providerId);
      console.log('🔴 [GET EMPLOYEE SLOTS] Provider services:', services);
      
      // Generar slots disponibles
      const availableSlots: string[] = [];
      
      // Generar slots de 30 minutos
      const startTime = new Date(`2000-01-01T${dayAvailability.start_time}`);
      const endTime = new Date(`2000-01-01T${dayAvailability.end_time}`);
      
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        
        // Calcular tiempo de fin del servicio seleccionado
        const slotStart = currentTime.getTime();
        const slotEnd = slotStart + (serviceDuration * 60 * 1000);
        
        // Check if service would extend beyond availability period
        if (slotEnd > endTime.getTime()) {
          console.log('🔴 [GET EMPLOYEE SLOTS] Service would extend beyond availability for slot:', timeString);
          break; // No more slots can fit the full service duration
        }
        
        // Verificar si este slot y toda su duración están disponibles
        const hasConflict = existingAppointments?.some(apt => {
          const aptTime = new Date(`2000-01-01T${apt.appointment_time}`);
          const service = services.find(s => s.id === apt.service_id);
          const aptDuration = service?.duration_minutes || apt.services?.duration_minutes || 60;
          
          const aptStart = aptTime.getTime();
          const aptEnd = aptStart + (aptDuration * 60 * 1000);
          
          // Check if there's any overlap between the new service slot and existing appointment
          const overlap = (slotStart < aptEnd && slotEnd > aptStart);
          if (overlap) {
            console.log('🔴 [GET EMPLOYEE SLOTS] Conflict detected for slot', timeString, '- overlaps with appointment at', apt.appointment_time);
          }
          return overlap;
        });

        if (!hasConflict) {
          availableSlots.push(timeString);
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }

      console.log('🔴 [GET EMPLOYEE SLOTS] Generated slots:', { 
        date, 
        employee: employeeId, 
        serviceDuration, 
        slotsCount: availableSlots.length, 
        slots: availableSlots 
      });

      return availableSlots;
    } catch (error) {
      console.error('Error fetching employee available slots:', error);
      throw error;
    }
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

      // Crear timestamp combinando fecha y hora
      const startTimestamp = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();
      
      // Obtener duración del servicio para calcular end_ts
      const { data: serviceData } = await supabase
        .from('services')
        .select('duration_minutes')
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
        .select('*')
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

  // 📍 Confirmar cita (método específico)
  static async confirmAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  }

  // 📍 Cancelar cita (método específico)
  static async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
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
        .select('client_id, provider_id, service_id')
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
      
      // If date/time is being updated, we need to recalculate timestamps
      let updatePayload: any = { ...updateData };
      
      if (updateData.appointment_date && updateData.appointment_time) {
        const startTimestamp = new Date(`${updateData.appointment_date}T${updateData.appointment_time}:00`).toISOString();
        
        // Get service duration to calculate end timestamp
        let durationMinutes = 30; // default
        const serviceId = updateData.service_id || currentAppointment.service_id;
        if (serviceId) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', serviceId)
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
        await this.updateProviderRating(appointment.provider_id);

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
      console.log('🔴 [BOOKING SERVICE] Updating provider rating for:', providerId);
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

      if (error) throw error;
      
      console.log('🔴 [BOOKING SERVICE] Found reviews:', { count: reviews?.length, reviews });

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const roundedRating = Math.round(averageRating * 100) / 100;
        
        console.log('🔴 [BOOKING SERVICE] Calculated rating:', { averageRating, roundedRating, totalReviews: reviews.length });
        
        const { error: updateError } = await supabase
          .from('providers')
          .update({
            rating: roundedRating,
            total_reviews: reviews.length
          })
          .eq('id', providerId);
          
        if (updateError) {
          console.error('🔴 [BOOKING SERVICE] Error updating provider:', updateError);
          throw updateError;
        }
        
        console.log('🎉 [BOOKING SERVICE] ✅ Provider rating updated successfully!');
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
        .select()
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
      
      // Extract providers from the join result
      return (data || []).map(item => item.providers as Provider);
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
}
