# Send Email Edge Function

This Supabase Edge Function handles sending emails for employee invitations and other notifications using [Resend](https://resend.com).

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Resend API Key**: Get your API key from the Resend dashboard
3. **Verified Domain**: (Optional but recommended) Verify a domain in Resend for production

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Set Environment Variables

Set the `RESEND_API_KEY` secret in your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Or via Supabase Dashboard:
1. Go to your project settings
2. Navigate to "Edge Functions" → "Secrets"
3. Add `RESEND_API_KEY` with your Resend API key

### 5. Deploy the Function

```bash
supabase functions deploy send-email
```

## Usage

The function accepts POST requests with the following payload:

```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content (optional)"
}
```

### Example Request

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello</h1><p>This is a test email</p>"
  }'
```

## Testing Locally

1. Start Supabase locally:
```bash
supabase start
```

2. Set the environment variable locally:
```bash
# Create .env file in supabase/functions/send-email/
echo "RESEND_API_KEY=re_your_api_key_here" > supabase/functions/send-email/.env
```

3. Serve the function:
```bash
supabase functions serve send-email --env-file supabase/functions/send-email/.env
```

4. Test the function:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello</h1><p>This is a test</p>"
  }'
```

## Configuration

### Update Sender Email

In `index.ts`, update the `from` field to match your verified domain:

```typescript
from: 'AgendaVE <noreply@yourdomain.com>',
```

For development/testing without a verified domain, you can use:
```typescript
from: 'onboarding@resend.dev',
```

## Troubleshooting

### Error: "Email service not configured"

This means `RESEND_API_KEY` is not set. Follow step 4 in Setup.

### Error: "Failed to send email"

- Check that your Resend API key is valid
- Verify that the sender email domain is verified in Resend
- Check Supabase function logs: `supabase functions logs send-email`

### CORS Errors

The function includes CORS headers to allow cross-origin requests. If you still experience CORS issues, check that you're using the correct Authorization header.

## Monitoring

View function logs:
```bash
supabase functions logs send-email
```

Or in Supabase Dashboard:
1. Go to "Edge Functions"
2. Select "send-email"
3. View logs and invocations

## Alternative Email Providers

To use a different email provider (SendGrid, Mailgun, etc.), update the fetch call in `index.ts` to use their API instead of Resend's.
