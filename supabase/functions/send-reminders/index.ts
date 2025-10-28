// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

type AppointmentRow = {
  id: string;
  provider_id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  services?: { name?: string | null } | null;
  providers?: { business_name?: string | null } | null;
  profiles?: { display_name?: string | null } | null;
};

type ProviderSettingsRow = {
  provider_id: string;
  reminder_lead_time_minutes?: number | null;
};

type ReminderLogRow = {
  appointment_id: string;
};

const DEFAULT_REMINDER_LEAD_MINUTES = 60;
const LOOKAHEAD_DAYS = 3;

serve(async () => {
  try {
    const now = new Date();
    const lookAhead = new Date(now);
    lookAhead.setDate(lookAhead.getDate() + LOOKAHEAD_DAYS);

    const startDateIso = now.toISOString().split('T')[0];
    const endDateIso = lookAhead.toISOString().split('T')[0];

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(
        `
          id,
          provider_id,
          client_id,
          appointment_date,
          appointment_time,
          services ( name ),
          providers ( business_name ),
          profiles!appointments_client_id_fkey ( display_name )
        `
      )
      .eq('status', 'confirmed')
      .gte('appointment_date', startDateIso)
      .lte('appointment_date', endDateIso);

    if (appointmentsError) {
      console.error('[send-reminders] Error fetching appointments', appointmentsError);
      return jsonResponse({ ok: false, error: appointmentsError.message }, 500);
    }

    const upcomingAppointments = (appointments as AppointmentRow[]) || [];
    if (upcomingAppointments.length === 0) {
      return jsonResponse({ ok: true, processed: 0, sent: 0 });
    }

    const providerIds = Array.from(
      new Set(upcomingAppointments.map((apt) => apt.provider_id).filter(Boolean))
    );

    const { data: settingsRows, error: settingsError } = await supabase
      .from('provider_settings')
      .select('provider_id, reminder_lead_time_minutes')
      .in('provider_id', providerIds.length > 0 ? providerIds : ['00000000-0000-0000-0000-000000000000']);

    if (settingsError) {
      console.error('[send-reminders] Error fetching provider settings', settingsError);
    }

    const settingsMap = new Map<string, ProviderSettingsRow>();
    (settingsRows as ProviderSettingsRow[] | null)?.forEach((row) => {
      settingsMap.set(row.provider_id, row);
    });

    const appointmentIds = upcomingAppointments.map((apt) => apt.id);

    const { data: reminderLogs, error: reminderLogsError } = await supabase
      .from('appointment_reminder_logs')
      .select('appointment_id')
      .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('channel', 'push');

    if (reminderLogsError) {
      console.error('[send-reminders] Error fetching reminder logs', reminderLogsError);
    }

    const alreadySent = new Set(
      ((reminderLogs as ReminderLogRow[] | null) || []).map((log) => log.appointment_id)
    );

    let sentCount = 0;

    for (const appointment of upcomingAppointments) {
      if (alreadySent.has(appointment.id)) {
        continue;
      }

      const appointmentDate = toDate(appointment.appointment_date, appointment.appointment_time);
      if (!appointmentDate) {
        continue;
      }

      const diffMinutes = Math.floor((appointmentDate.getTime() - now.getTime()) / 60000);
      if (diffMinutes <= 0) {
        continue;
      }

      const providerSettings = settingsMap.get(appointment.provider_id);
      const reminderLead =
        providerSettings?.reminder_lead_time_minutes ?? DEFAULT_REMINDER_LEAD_MINUTES;

      if (diffMinutes > reminderLead) {
        continue;
      }

      const sent = await sendPushReminder(appointment);
      if (sent) {
        sentCount += 1;
        await supabase.from('appointment_reminder_logs').insert({
          appointment_id: appointment.id,
          provider_id: appointment.provider_id,
          client_id: appointment.client_id,
          channel: 'push',
          metadata: {
            reminder_lead_minutes: reminderLead,
            diff_minutes: diffMinutes,
          },
        });
      }
    }

    return jsonResponse({
      ok: true,
      processed: upcomingAppointments.length,
      sent: sentCount,
    });
  } catch (error) {
    console.error('[send-reminders] Unexpected error', error);
    return jsonResponse({ ok: false, error: String(error) }, 500);
  }
});

function toDate(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date) return null;
  const safeTime = (time || '00:00').slice(0, 5);
  const candidate = new Date(`${date}T${safeTime}`);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
}

async function sendPushReminder(appointment: AppointmentRow): Promise<boolean> {
  const { data: tokens, error: tokensError } = await supabase
    .from('device_push_tokens')
    .select('token, expo_token')
    .eq('user_id', appointment.client_id)
    .eq('is_active', true);

  if (tokensError) {
    console.error('[send-reminders] Error fetching push tokens', tokensError);
    return false;
  }

  const tokenRows = tokens || [];
  if (tokenRows.length === 0) {
    console.log('[send-reminders] No active tokens for appointment', appointment.id);
    return false;
  }

  const providerName = appointment.providers?.business_name || 'tu proveedor';
  const serviceName = appointment.services?.name || 'tu servicio';
  const title = 'Recordatorio de cita ⏰';
  const body = `Tienes "${serviceName}" en ${providerName} a las ${appointment.appointment_time}.`;

  const messages = tokenRows
    .map((row) => row.token || row.expo_token)
    .filter((token): token is string => Boolean(token))
    .map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'appointment_reminder',
        appointment_id: appointment.id,
      },
    }));

  if (messages.length === 0) {
    return false;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[send-reminders] Push notification failed', errorText);
      return false;
    }

    const result = await response.json();
    console.log('[send-reminders] Push notifications sent', result);
    return true;
  } catch (error) {
    console.error('[send-reminders] Error sending push notification', error);
    return false;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
