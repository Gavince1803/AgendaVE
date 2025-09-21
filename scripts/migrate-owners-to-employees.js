// Run this in your browser console to add existing provider owners as employees
// This is a one-time migration script for existing providers

async function migrateOwnersToEmployees() {
  console.log('🔴 [MIGRATION] Starting migration: Adding owners as employees...');

  const knownProviders = [
    {
      id: '650e8400-e29b-41d4-a716-446655440001',
      name: 'Elite Barbershop Owner',
      business_name: 'Elite Barbershop'
    },
    {
      id: '302792e8-4c71-4827-ab0f-3961127c1ae3', 
      name: 'Barberia Ouyea Owner',
      business_name: 'Barberia Ouyea'
    }
    // Add more providers as needed
  ];

  // Get the current auth token from the app
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3h4cmdkY2VyZnRsbWV5cm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjczNTU0MSwiZXhwIjoyMDQ4MzExNTQxfQ.D1OHNJbB7L7GfgCLwKFKcKl2Mh8lx8HgY5VJ2KwL3Ys';

  for (const provider of knownProviders) {
    try {
      const employee = {
        provider_id: provider.id,
        name: provider.name,
        position: 'Propietario',
        bio: `Propietario de ${provider.business_name}`,
        is_owner: true,
        is_active: true,
        custom_schedule_enabled: false,
        profile_image_url: null
      };

      const response = await fetch('https://ldgxxrgdcerftlmeyrmi.supabase.co/rest/v1/employees', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZ3h4cmdkY2VyZnRsbWV5cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzU1NDEsImV4cCI6MjA0ODMxMTU0MX0.pJgXjqUXOXpLg52JaiwCg4qUH3x0JgQYABOr2Y67t3E',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(employee)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [MIGRATION] Created owner employee for:', provider.business_name);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ [MIGRATION] Could not create employee for:', provider.business_name, errorText);
      }
    } catch (error) {
      console.error('❌ [MIGRATION] Error migrating:', provider.business_name, error);
    }
  }

  console.log('🔴 [MIGRATION] Migration completed! Refresh to see employees.');
}

// Instructions
console.log('🔄 [MIGRATION] To migrate existing providers to have owner employees:');
console.log('Run: migrateOwnersToEmployees()');

// Automatically run for known providers
migrateOwnersToEmployees();