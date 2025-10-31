import { supabase } from './supabase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send employee invitation email
   */
  static async sendEmployeeInvitation(
    employeeEmail: string,
    employeeName: string,
    businessName: string,
    invitationLink: string
  ): Promise<void> {
    try {
      console.log('📧 [EMAIL SERVICE] Sending employee invitation to:', employeeEmail);
      
      const emailData = {
        to: employeeEmail,
        subject: `Invitación para unirse a ${businessName} en AgendaVE`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">¡Bienvenido a AgendaVE!</h2>
            <p>Hola ${employeeName},</p>
            <p>Has sido invitado a unirte al equipo de <strong>${businessName}</strong> en AgendaVE.</p>
            <p>Para aceptar la invitación y configurar tu cuenta, haz clic en el siguiente enlace:</p>
            <div style="margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceptar Invitación
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:<br>
              <a href="${invitationLink}" style="color: #3b82f6;">${invitationLink}</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              Este correo fue enviado desde AgendaVE. Si no esperabas este correo, puedes ignorarlo.
            </p>
          </div>
        `,
        text: `
Hola ${employeeName},

Has sido invitado a unirte al equipo de ${businessName} en AgendaVE.

Para aceptar la invitación y configurar tu cuenta, visita el siguiente enlace:
${invitationLink}

Si no esperabas este correo, puedes ignorarlo.

AgendaVE
        `.trim()
      };

      // Call Supabase Edge Function to send email
      // You need to create this function in Supabase
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('📧 [EMAIL SERVICE] Error sending email:', error);
        throw new Error(`Error al enviar email: ${error.message}`);
      }

      console.log('📧 [EMAIL SERVICE] ✅ Email sent successfully:', data);
    } catch (error) {
      console.error('📧 [EMAIL SERVICE] Error in sendEmployeeInvitation:', error);
      throw error;
    }
  }

  /**
   * Generate employee invitation link
   */
  static generateInvitationLink(employeeId: string, providerId: string, token: string): string {
    // In production, use your actual app URL
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://agendave.app';
    return `${baseUrl}/employee-setup?employee=${employeeId}&provider=${providerId}&token=${token}`;
  }

  /**
   * Create invitation token for employee
   */
  static async createInvitationToken(employeeId: string, providerId: string): Promise<string> {
    try {
      // Generate a secure random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store token in database with expiration (e.g., 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('employee_invitations')
        .insert({
          employee_id: employeeId,
          provider_id: providerId,
          token,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (error) {
        console.error('📧 [EMAIL SERVICE] Error creating invitation token:', error);
        throw error;
      }

      return token;
    } catch (error) {
      console.error('📧 [EMAIL SERVICE] Error in createInvitationToken:', error);
      throw error;
    }
  }

  /**
   * Verify invitation token
   */
  static async verifyInvitationToken(token: string): Promise<{
    valid: boolean;
    employeeId?: string;
    providerId?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select('employee_id, provider_id, expires_at, used')
        .eq('token', token)
        .single();

      if (error || !data) {
        return { valid: false };
      }

      // Check if token is expired or already used
      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (data.used || now > expiresAt) {
        return { valid: false };
      }

      return {
        valid: true,
        employeeId: data.employee_id,
        providerId: data.provider_id
      };
    } catch (error) {
      console.error('📧 [EMAIL SERVICE] Error verifying token:', error);
      return { valid: false };
    }
  }

  /**
   * Mark invitation token as used
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_invitations')
        .update({ used: true })
        .eq('token', token);

      if (error) {
        console.error('📧 [EMAIL SERVICE] Error marking token as used:', error);
        throw error;
      }
    } catch (error) {
      console.error('📧 [EMAIL SERVICE] Error in markTokenAsUsed:', error);
      throw error;
    }
  }
}
