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
        subject: `🎉 Invitación para unirse a ${businessName} en AgendaVE`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 40px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 ¡Bienvenido!</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">AgendaVE</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hola <strong>${employeeName}</strong>,</p>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                  Has sido invitado a unirte al equipo de <strong style="color: #3b82f6;">${businessName}</strong> en AgendaVE.
                </p>
                
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>📝 Pasos para aceptar:</strong><br>
                    1️⃣ Descarga la app AgendaVE<br>
                    2️⃣ Inicia sesión o crea tu cuenta<br>
                    3️⃣ Haz clic en el botón de abajo
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${invitationLink}" 
                     style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                    Aceptar Invitación →
                  </a>
                </div>
                
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;"><strong>Si el botón no funciona:</strong></p>
                  <p style="color: #6b7280; font-size: 12px; margin: 0; word-break: break-all;">
                    Copia y pega este enlace:<br>
                    <a href="${invitationLink}" style="color: #3b82f6;">${invitationLink}</a>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                  Este correo fue enviado desde AgendaVE.<br>
                  Si no esperabas este correo, puedes ignorarlo de forma segura.
                </p>
              </div>
            </div>
          </body>
          </html>
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
