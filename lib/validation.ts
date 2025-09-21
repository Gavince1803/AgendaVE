// 🛡️ Input Validation and Sanitization for Production Security
// This module provides comprehensive validation for all user inputs

import { z } from 'zod';

// 📧 Email validation
export const emailSchema = z.string()
  .email('Email inválido')
  .min(5, 'Email muy corto')
  .max(320, 'Email muy largo')
  .refine(email => !email.includes('+'), 'No se permiten símbolos + en el email');

// 📱 Phone validation (Venezuelan format)
export const phoneSchema = z.string()
  .regex(/^\+58[0-9]{10}$/, 'Formato de teléfono inválido (debe ser +58XXXXXXXXXX)')
  .or(z.string().regex(/^[0-9]{11}$/, 'Formato de teléfono inválido (debe tener 11 dígitos)'));

// 👤 Name validation
export const nameSchema = z.string()
  .min(2, 'Nombre muy corto')
  .max(50, 'Nombre muy largo')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Solo se permiten letras y espacios');

// 🏢 Business validation
export const businessNameSchema = z.string()
  .min(3, 'Nombre de negocio muy corto')
  .max(100, 'Nombre de negocio muy largo')
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-&.]+$/, 'Caracteres inválidos en nombre de negocio');

// 💰 Price validation
export const priceSchema = z.number()
  .min(0.01, 'El precio debe ser mayor a 0')
  .max(999999.99, 'Precio muy alto')
  .refine(price => Number.isFinite(price), 'Precio inválido');

// ⏰ Duration validation (minutes)
export const durationSchema = z.number()
  .int('La duración debe ser un número entero')
  .min(5, 'Duración mínima: 5 minutos')
  .max(480, 'Duración máxima: 8 horas');

// 📝 Description validation
export const descriptionSchema = z.string()
  .min(10, 'Descripción muy corta (mínimo 10 caracteres)')
  .max(500, 'Descripción muy larga (máximo 500 caracteres)')
  .refine(desc => !containsProfanity(desc), 'La descripción contiene lenguaje inapropiado');

// 🔗 URL validation
export const urlSchema = z.string()
  .url('URL inválida')
  .refine(url => {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }, 'Solo se permiten URLs HTTP/HTTPS');

// ⭐ Rating validation
export const ratingSchema = z.number()
  .int('La calificación debe ser un número entero')
  .min(1, 'Calificación mínima: 1')
  .max(5, 'Calificación máxima: 5');

// 📅 Date validation
export const futureDateSchema = z.string()
  .refine(dateStr => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'La fecha debe ser hoy o en el futuro');

// ⏰ Time validation
export const timeSchema = z.string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)');

// 🚫 Profanity filter (basic implementation)
function containsProfanity(text: string): boolean {
  const profanityWords = [
    // Add Spanish profanity words here
    'mierda', 'pendejo', 'cabrón', 'hijo de puta',
    // Add more as needed
  ];
  
  const lowercaseText = text.toLowerCase();
  return profanityWords.some(word => lowercaseText.includes(word));
}

// 🧹 Text sanitization
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 1000); // Limit length
}

// 🔐 Password validation for registration
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'Contraseña muy larga')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe tener al menos: 1 minúscula, 1 mayúscula y 1 número');

// 📊 Combined schemas for different forms
export const providerRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  businessName: businessNameSchema,
  phone: phoneSchema.optional(),
  category: z.enum(['hair', 'beauty', 'spa', 'barber', 'nails', 'massage', 'other']),
  bio: z.string().max(200, 'Biografía muy larga').optional(),
});

export const serviceCreationSchema = z.object({
  name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: descriptionSchema.optional(),
  priceAmount: priceSchema,
  durationMinutes: durationSchema,
});

export const appointmentCreationSchema = z.object({
  serviceId: z.string().uuid('ID de servicio inválido'),
  appointmentDate: futureDateSchema,
  appointmentTime: timeSchema,
  notes: z.string().max(200, 'Notas muy largas').optional(),
});

export const reviewCreationSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  rating: ratingSchema,
  comment: z.string().max(300, 'Comentario muy largo').optional(),
});

// 🔍 Validation helper functions
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(firstError.message, firstError.path[0]?.toString());
    }
    throw new ValidationError('Error de validación desconocido');
  }
}

// 🛡️ Rate limiting helper (client-side tracking)
export class RateLimiter {
  private static attempts: Map<string, number[]> = new Map();
  
  static canAttempt(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
}

export default {
  emailSchema,
  phoneSchema,
  nameSchema,
  businessNameSchema,
  priceSchema,
  durationSchema,
  descriptionSchema,
  urlSchema,
  ratingSchema,
  futureDateSchema,
  timeSchema,
  passwordSchema,
  providerRegistrationSchema,
  serviceCreationSchema,
  appointmentCreationSchema,
  reviewCreationSchema,
  sanitizeText,
  validateInput,
  ValidationError,
  RateLimiter,
};