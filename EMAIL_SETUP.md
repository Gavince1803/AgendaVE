# Email Setup for Employee Invitations

This guide explains how to set up email invitations for employees in AgendaVE.

## ⚠️ Current Status

**Issue**: Email invitations are failing with "Edge Function returned a non-2xx status code"

**What's Working**:
- ✅ Employees are being created successfully
- ✅ Invitation tokens are generated
- ✅ The app continues to function

**What's Not Working**:
- ❌ Invitation emails are not being sent
- ❌ The Edge Function needs `RESEND_API_KEY` configured

**Quick Fix** (5 minutes):
1. Sign up at [resend.com](https://resend.com) (free)
2. Get your API key
3. In Supabase Dashboard → Edge Functions → Secrets
4. Add: `RESEND_API_KEY` = your key
5. Done! Emails will start working immediately ✅

**Temporary Workaround**:
Employees can still be invited! Just copy the invitation link from the app and share it manually with your team members.

## Overview

The email invitation system allows providers to send invitation links to employees when they're added to the team. The system uses:
- Supabase Edge Functions for sending emails
- Resend API (or alternative email service) for email delivery
- Token-based invitation links with expiration

## Setup Steps

### 1. Create the Database Table

Run the migration to create the `employee_invitations` table:

```bash
# Connect to your Supabase project
psql -h db.<your-project-ref>.supabase.co -U postgres -d postgres

# Run the migration
\i database/migrations/add_employee_invitations_table.sql
```

Or use the Supabase Dashboard:
1. Go to SQL Editor
2. Copy the contents of `database/migrations/add_employee_invitations_table.sql`
3. Run the query

### 2. Set Up Email Service (Resend)

1. **Sign up for Resend** (recommended): https://resend.com
   - Free tier: 100 emails/day, 3,000 emails/month
   - Alternative services: SendGrid, Mailgun, AWS SES

2. **Get API Key**:
   - Go to Resend Dashboard → API Keys
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Verify your domain** (for production):
   - In Resend Dashboard → Domains
   - Add your domain (e.g., `agendave.app`)
   - Add the DNS records they provide
   - Wait for verification

### 3. Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref <your-project-ref>
```

4. **Set the Resend API key as a secret**:
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

5. **Deploy the Edge Function**:
```bash
supabase functions deploy send-email
```

### 4. Update Environment Variables

Add to your `.env` file:
```bash
EXPO_PUBLIC_APP_URL=https://your-app-url.com
```

For development/testing:
```bash
EXPO_PUBLIC_APP_URL=http://localhost:19000
```

### 5. Testing

#### Test the Edge Function locally:

1. Start local Supabase:
```bash
supabase start
```

2. Serve the function locally:
```bash
supabase functions serve send-email --env-file .env.local
```

3. Test with curl:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "subject": "Test Invitation",
    "html": "<p>Test email</p>",
    "text": "Test email"
  }'
```

#### Test employee invitation:

1. Add an employee with an email address
2. Check the console logs for email sending status
3. Check the employee's email inbox for the invitation

## How It Works

1. **Provider adds employee** with email address
2. **System creates invitation token** (expires in 7 days)
3. **Email is sent** with invitation link
4. **Employee clicks link** → redirected to setup page
5. **Token is verified** and marked as used
6. **Employee completes setup** → account activated

## Email Template Customization

Edit the email template in `lib/email-service.ts`:

```typescript
const emailData = {
  to: employeeEmail,
  subject: `Invitation to join ${businessName}`,
  html: `...your custom HTML...`,
  text: `...plain text version...`
}
```

## Troubleshooting

### Email not sending

1. **Check Resend API key**: Make sure it's set correctly in Supabase secrets
2. **Check domain verification**: Emails may go to spam if domain isn't verified
3. **Check function logs**: 
   ```bash
   supabase functions logs send-email
   ```
4. **Check RLS policies**: Make sure the policies allow creating invitation tokens

### Token errors

1. **Check database**: Verify `employee_invitations` table exists
2. **Check expiration**: Tokens expire after 7 days
3. **Check if used**: Tokens can only be used once

### Alternative Email Services

To use a different email service (SendGrid, Mailgun, etc.):

1. Update `supabase/functions/send-email/index.ts`
2. Replace Resend API call with your service's API
3. Update the `RESEND_API_KEY` secret name if needed

## Production Checklist

- [ ] Verify domain with Resend
- [ ] Set up proper "from" email address
- [ ] Deploy Edge Function to production
- [ ] Set Resend API key as production secret
- [ ] Update `EXPO_PUBLIC_APP_URL` to production URL
- [ ] Test invitation flow end-to-end
- [ ] Set up email monitoring/logging
- [ ] Configure SPF/DKIM/DMARC records

## Security Notes

- Tokens expire after 7 days
- Tokens can only be used once
- Tokens are cryptographically secure (256-bit random)
- RLS policies protect invitation data
- Email service runs on secure Edge Function

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Check Resend delivery logs
- Review console output in app
